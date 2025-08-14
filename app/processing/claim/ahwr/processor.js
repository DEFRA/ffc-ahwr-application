import { getAmount } from '../../../lib/getAmount.js'
import { isMultipleHerdsUserJourney } from '../../../lib/context-helper.js'
import {
  addHerdToClaimData,
  getByApplicationReference,
  setClaim
} from '../../../repositories/claim-repository.js'
import { generateClaimStatus } from '../../../lib/requires-compliance-check.js'
import { createHerd, getHerdById, updateIsCurrentHerd } from '../../../repositories/herd-repository.js'
import { arraysAreEqual } from '../../../lib/array-utils.js'
import { buildData } from '../../../data/index.js'
import { emitHerdMIEvents } from '../../../lib/emit-herd-MI-events.js'
import { sendMessage } from '../../../messaging/send-message.js'
import { v4 as uuid } from 'uuid'
import { requestClaimConfirmationEmail } from '../../../lib/request-email.js'
import { claimType, livestockToReadableSpecies } from '../../../constants/index.js'
import appInsights from 'applicationinsights'
import { TYPE_OF_LIVESTOCK, UNNAMED_FLOCK, UNNAMED_HERD } from 'ffc-ahwr-common-library'
import { config } from '../../../config/index.js'

const { sequelize } = buildData
const { notify: { templateIdFarmerEndemicsReviewComplete, templateIdFarmerEndemicsFollowupComplete }, messageGeneratorMsgType, messageGeneratorQueue } = config

const hasHerdChanged = (existingHerd, updatedHerd) => existingHerd.cph !== updatedHerd.cph || !arraysAreEqual(existingHerd.herdReasons.sort(), updatedHerd.herdReasons.sort())

const isUpdate = (herd) => herd.herdVersion > 1

const validateUpdate = (existingHerd, updatedHerd) => {
  if (!existingHerd) {
    throw Error('Herd not found')
  }
  if (!existingHerd.isCurrent) {
    throw Error('Attempting to update an older version of a herd')
  }
  if (existingHerd.version === updatedHerd.herdVersion) {
    throw Error('Attempting to update a herd with the same version')
  }
}

const createOrUpdateHerd = async (herd, applicationReference, createdBy, typeOfLivestock, logger) => {
  let herdModel, herdWasUpdated

  if (isUpdate(herd)) {
    const existingHerdModel = await getHerdById(herd.herdId)
    validateUpdate(existingHerdModel?.dataValues, herd)

    if (hasHerdChanged(existingHerdModel.dataValues, herd)) {
      const { id, version, species, herdName } = existingHerdModel.dataValues
      herdModel = await createHerd({
        id,
        version: version + 1,
        applicationReference,
        species,
        herdName,
        cph: herd.cph,
        herdReasons: herd.herdReasons.sort(),
        createdBy
      })
      await updateIsCurrentHerd(herd.herdId, false, version)
      herdWasUpdated = true // To check, but actually does feel like we should be setting this
    } else {
      logger.info('Herd has not changed')
      herdModel = existingHerdModel
      herdWasUpdated = false
    }
  } else {
    herdModel = await createHerd({
      version: 1,
      applicationReference,
      species: typeOfLivestock,
      herdName: herd.herdName,
      cph: herd.cph,
      herdReasons: herd.herdReasons.sort(),
      createdBy
    })

    herdWasUpdated = true
  }

  return { herdModel, herdWasUpdated }
}

const addHerdToPreviousClaims = async (herdClaimData, applicationReference, sbi, createdBy, previousClaims, logger) => {
  logger.info('Associating new herd with previous claims for agreement ' + applicationReference)
  const previousClaimsWithoutHerd = previousClaims.filter(claim => { return !claim.data.herdId })
  await Promise.all(previousClaimsWithoutHerd.map(claim =>
    addHerdToClaimData({ claimRef: claim.reference, herdClaimData, createdBy, applicationReference, sbi })
  ))
}

const addClaimAndHerdToDatabase = async (claimPayload, logger, isMultiHerdsClaim, { sbi, applicationReference, claimReference, typeOfLivestock, amount, dateOfVisit }) => {
  let herdGotUpdated; let herdData = {}

  const { herd, ...payloadData } = claimPayload.data

  const claim = await sequelize.transaction(async () => {
    let claimHerdData = {}

    if (isMultiHerdsClaim) {
      const { herdModel, herdWasUpdated } = await createOrUpdateHerd(herd, applicationReference, claimPayload.createdBy, typeOfLivestock, logger)

      herdGotUpdated = herdWasUpdated
      herdData = herdModel.dataValues

      claimHerdData = {
        herdId: herdData.id,
        herdVersion: herdData.version,
        herdAssociatedAt: new Date().toISOString()
      }
      if (herd.herdSame === 'yes') {
        const previousClaimsForSpecies = await getByApplicationReference(applicationReference, typeOfLivestock)
        await addHerdToPreviousClaims({ ...claimHerdData, herdName: herdData.herdName }, applicationReference, sbi, claimPayload.createdBy, previousClaimsForSpecies, logger)
      }
    }

    const previousClaimsForSpeciesAfterUpdates = await getByApplicationReference(applicationReference, typeOfLivestock)
    const statusId = await generateClaimStatus(dateOfVisit, claimHerdData.herdId, previousClaimsForSpeciesAfterUpdates, logger)
    const data = { ...payloadData, amount, claimType: claimPayload.type, ...claimHerdData }
    return setClaim({ ...claimPayload, reference: claimReference, data, statusId, sbi })
  })

  return { claim, herdGotUpdated, herdData }
}

const sendClaimConfirmationEmail = async (claim, application, { sbi, applicationReference, type, typeOfLivestock, dateOfVisit, amount, herdData }) => {
  const { crn, email, farmerName, name: orgName, orgEmail } = application.data.organisation

  const claimConfirmationEmailSent = await requestClaimConfirmationEmail({
    reference: claim.reference,
    applicationReference,
    amount,
    email,
    farmerName,
    species: livestockToReadableSpecies[typeOfLivestock],
    orgData: {
      orgName,
      orgEmail,
      crn,
      sbi
    },
    herdNameLabel: getHerdNameLabel(typeOfLivestock),
    herdName: herdData.herdName ?? getUnnamedHerdValue(typeOfLivestock)
  },
  isFollowUp(claim.type) ? templateIdFarmerEndemicsFollowupComplete : templateIdFarmerEndemicsReviewComplete
  )

  if (claimConfirmationEmailSent) {
    appInsights.defaultClient.trackEvent({
      name: 'process-claim',
      properties: {
        data: {
          applicationReference,
          typeOfLivestock,
          dateOfVisit,
          claimType: type,
          piHunt: claim.data.piHunt
        },
        reference: claim.reference,
        status: claim.statusId,
        sbi,
        scheme: 'new-world'
      }
    })
  }
}

const getUnnamedHerdValue = (typeOfLivestock) => typeOfLivestock === TYPE_OF_LIVESTOCK.SHEEP ? UNNAMED_FLOCK : UNNAMED_HERD
const getHerdNameLabel = (typeOfLivestock) => typeOfLivestock === TYPE_OF_LIVESTOCK.SHEEP ? 'Flock name' : 'Herd name'
const isFollowUp = (type) => type === claimType.endemics

export async function saveClaimAndRelatedData (sbi, claimData, flags, logger) {
  const { incoming: claimDataPayload, claimReference } = claimData
  const { typeOfLivestock, dateOfVisit } = claimDataPayload.data
  const { applicationReference } = claimDataPayload

  const amount = await getAmount(claimDataPayload)

  const isMultiHerdsClaim = isMultipleHerdsUserJourney(dateOfVisit, flags)

  const { claim, herdGotUpdated, herdData } = await addClaimAndHerdToDatabase(claimDataPayload, logger, isMultiHerdsClaim, { sbi, applicationReference, claimReference, typeOfLivestock, amount, dateOfVisit })

  return { claim, herdGotUpdated, herdData, isMultiHerdsClaim }
}

export async function generateEventsAndComms (isMultiHerdsClaim, claim, application, herdData, herdGotUpdated, herdIdSelected) {
  const { reference: claimReference, type, statusId } = claim
  const { amount, typeOfLivestock, dateOfVisit, reviewTestResults, piHuntRecommended, piHuntAllAnimals } = claim.data
  const { reference: applicationReference, data: { organisation: { sbi, crn } } } = application

  if (isMultiHerdsClaim) {
    await emitHerdMIEvents({ sbi, herdData, herdIdSelected, herdGotUpdated, claimReference, applicationReference })
  }

  await sendClaimConfirmationEmail(claim, application, { sbi, applicationReference, type, typeOfLivestock, dateOfVisit, amount, herdData })

  await sendMessage(
    {
      crn,
      sbi,
      agreementReference: applicationReference,
      claimReference,
      claimStatus: statusId,
      claimType: type,
      typeOfLivestock,
      reviewTestResults,
      piHuntRecommended,
      piHuntAllAnimals,
      dateTime: new Date(),
      herdName: herdData.herdName ?? getUnnamedHerdValue(typeOfLivestock)
    },
    messageGeneratorMsgType,
    messageGeneratorQueue,
    { sessionId: uuid() }
  )
}
