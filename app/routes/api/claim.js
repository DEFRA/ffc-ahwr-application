import joi from 'joi'
import { v4 as uuid } from 'uuid'
import appInsights from 'applicationinsights'
import { sendMessage } from '../../messaging/send-message.js'
import { config } from '../../config/index.js'
import {
  piHunt,
  piHuntAllAnimals,
  testResults as testResultsConstant,
  livestockTypes,
  claimType,
  applicationStatus,
  livestockToReadableSpecies,
  UNNAMED_FLOCK,
  UNNAMED_HERD, AHWR_SCHEME
} from '../../constants/index.js'
import { setClaim, searchClaims, getClaimByReference, updateClaimByReference, getByApplicationReference, isURNNumberUnique, addHerdToClaimData } from '../../repositories/claim-repository.js'
import { getApplication } from '../../repositories/application-repository.js'
import { requestClaimConfirmationEmail } from '../../lib/request-email.js'
import { getAmount } from '../../lib/getAmount.js'
import { generateClaimStatus } from '../../lib/requires-compliance-check.js'
import { searchPayloadSchema } from './schema/search-payload.schema.js'
import { createClaimReference } from '../../lib/create-reference.js'
import { isVisitDateAfterPIHuntAndDairyGoLive, isMultipleHerdsUserJourney } from '../../lib/context-helper.js'
import { createHerd, getHerdById, updateIsCurrentHerd } from '../../repositories/herd-repository.js'
import { buildData } from '../../data/index.js'
import { arraysAreEqual } from '../../lib/array-utils.js'
import { emitHerdMIEvents } from '../../lib/emit-herd-MI-events.js'
import { validateClaim } from '../../processing/claim/validation.js'
import { StatusCodes } from 'http-status-codes'

const { sequelize } = buildData

const { submitPaymentRequestMsgType, submitRequestQueue, notify: { templateIdFarmerEndemicsReviewComplete, templateIdFarmerEndemicsFollowupComplete }, messageGeneratorMsgType, messageGeneratorQueue } = config

const isFollowUp = (payload) => payload.type === claimType.endemics
const isSheep = (payload) => payload.data.typeOfLivestock === livestockTypes.sheep

const getHerdNameLabel = (payload) => isSheep(payload) ? 'Flock name' : 'Herd name'
const getUnnamedHerdValue = (payload) => isSheep(payload) ? UNNAMED_FLOCK : UNNAMED_HERD
const getUnnamedHerdValueByTypeOfLivestock = (typeOfLivestock) => typeOfLivestock === livestockTypes.sheep ? UNNAMED_FLOCK : UNNAMED_HERD

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

const addClaimAndHerdToDatabase = async (request, isMultiHerdsClaim, { sbi, applicationReference, claimReference, typeOfLivestock, amount, dateOfVisit }) => {
  let herdGotUpdated; let herdData = {}

  const { payload } = request
  const { herd, ...payloadData } = payload.data

  const claim = await sequelize.transaction(async () => {
    let claimHerdData = {}

    if (isMultiHerdsClaim) {
      const { herdModel, herdWasUpdated } = await createOrUpdateHerd(herd, applicationReference, payload.createdBy, typeOfLivestock, request.logger)

      herdGotUpdated = herdWasUpdated
      herdData = herdModel.dataValues

      claimHerdData = {
        herdId: herdModel.dataValues.id,
        herdVersion: herdModel.dataValues.version,
        herdAssociatedAt: new Date().toISOString()
      }
      if (herd.herdSame === 'yes') {
        const previousClaimsForSpecies = await getByApplicationReference(applicationReference, typeOfLivestock)
        await addHerdToPreviousClaims({ ...claimHerdData, herdName: herdModel.dataValues.herdName }, applicationReference, sbi, payload.createdBy, previousClaimsForSpecies, request.logger)
      }
    }

    const previousClaimsForSpeciesAfterUpdates = await getByApplicationReference(applicationReference, typeOfLivestock)
    const statusId = await generateClaimStatus(dateOfVisit, claimHerdData.herdId, previousClaimsForSpeciesAfterUpdates, request.logger)
    const data = { ...payloadData, amount, claimType: payload.type, ...claimHerdData }
    return setClaim({ ...payload, reference: claimReference, data, statusId, sbi })
  })

  return { claim, herdGotUpdated, herdData }
}

const sendClaimConfirmationEmail = async (request, claim, application, { sbi, applicationReference, type, typeOfLivestock, dateOfVisit, amount, herdData }) => {
  const { payload } = request

  const claimConfirmationEmailSent = await requestClaimConfirmationEmail({
    reference: claim.dataValues.reference,
    applicationReference: claim.dataValues.applicationReference,
    amount,
    email: application.dataValues.data.organisation.email,
    farmerName: application.dataValues.data.organisation.farmerName,
    species: livestockToReadableSpecies[typeOfLivestock],
    orgData: {
      orgName: application.dataValues.data.organisation.name,
      orgEmail: application.dataValues.data.organisation.orgEmail,
      crn: application.dataValues.data.organisation.crn,
      sbi: application.dataValues.data.organisation.sbi
    },
    herdNameLabel: getHerdNameLabel(payload),
    herdName: herdData.herdName ?? getUnnamedHerdValue(payload)
  },
  isFollowUp(payload) ? templateIdFarmerEndemicsFollowupComplete : templateIdFarmerEndemicsReviewComplete
  )

  request.logger.setBindings({ claimConfirmationEmailSent })

  if (claimConfirmationEmailSent) {
    appInsights.defaultClient.trackEvent({
      name: 'process-claim',
      properties: {
        data: {
          applicationReference,
          typeOfLivestock,
          dateOfVisit,
          claimType: type,
          piHunt: payload.data.piHunt
        },
        reference: claim?.dataValues?.reference,
        status: claim?.dataValues?.statusId,
        sbi,
        scheme: 'new-world'
      }
    })
  }
}

export const claimHandlers = [
  {
    method: 'GET',
    path: '/api/claim/get-by-reference/{ref}',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const claim = await getClaimByReference(request.params.ref)
        if (claim?.dataValues) {
          return h.response(claim.dataValues).code(200)
        } else {
          return h.response('Not Found').code(404).takeover()
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/api/claim/get-by-application-reference/{ref}',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string()
        }),
        query: joi.object({
          typeOfLivestock: joi.string().optional().valid(livestockTypes.beef, livestockTypes.dairy, livestockTypes.pigs, livestockTypes.sheep)
        })
      },
      handler: async (request, h) => {
        const { typeOfLivestock } = request.query
        const claims = await getByApplicationReference(request.params.ref, typeOfLivestock)

        return h.response(claims).code(200)
      }
    }
  },
  {
    method: 'POST',
    path: '/api/claim/search',
    options: {
      validate: {
        payload: joi.object({
          ...searchPayloadSchema,
          sort: joi.object({
            field: joi.string().valid().optional().allow(''),
            direction: joi.string().valid().optional().allow(''),
            reference: joi.string().valid().optional().allow('')
          }).optional()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })
          return h.response({ err }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const { search, filter, offset, limit, sort } = request.payload
        const { total, claims } = await searchClaims(
          search,
          filter,
          offset,
          limit,
          sort
        )
        return h.response({ total, claims }).code(200)
      }
    }
  },
  {
    method: 'POST',
    path: '/api/claim/is-urn-unique',
    options: {
      validate: {
        payload: joi.object({
          sbi: joi.string().required(),
          laboratoryURN: joi.string().required()
        })
      },
      handler: async (request, h) => {
        const { sbi, laboratoryURN } = request.payload
        const result = await isURNNumberUnique(sbi, laboratoryURN)

        return h.response(result).code(200)
      }
    }
  },
  {
    method: 'POST',
    path: '/api/claim',
    options: {
      handler: async (request, h) => {
        const { payload } = request
        const applicationReference = payload?.applicationReference
        const application = await getApplication(applicationReference)

        if (!application?.dataValues) {
          return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
        }

        const { error } = validateClaim(AHWR_SCHEME, request.payload, application.dataValues.flags)
        if (error) {
          request.logger.setBindings({ error })
          appInsights.defaultClient.trackException({ exception: error })
          return h.response({ error }).code(StatusCodes.BAD_REQUEST).takeover()
        }

        const tempClaimReference = payload.reference
        const { type } = payload
        const { typeOfLivestock, dateOfVisit, reviewTestResults, herd, laboratoryURN } = payload.data
        const claimReference = createClaimReference(tempClaimReference, type, typeOfLivestock)

        request.logger.setBindings({
          isFollowUp: isFollowUp(payload),
          applicationReference,
          claimReference,
          laboratoryURN
        })

        const sbi = application.dataValues.data.organisation.sbi

        request.logger.setBindings({ sbi })

        if (laboratoryURN) {
          const { isURNUnique } = await isURNNumberUnique(sbi, laboratoryURN)
          if (!isURNUnique) return h.response({ error: 'URN number is not unique' }).code(StatusCodes.BAD_REQUEST).takeover()
        }

        const amount = await getAmount(request.payload)

        const isMultiHerdsClaim = isMultipleHerdsUserJourney(dateOfVisit, application.dataValues.flags)

        const { claim, herdGotUpdated, herdData } = await addClaimAndHerdToDatabase(request, isMultiHerdsClaim, { sbi, applicationReference, claimReference, typeOfLivestock, amount, dateOfVisit })

        if (!claim) {
          throw new Error('Claim was not created')
        }

        if (isMultiHerdsClaim) {
          await emitHerdMIEvents({ sbi, herdData, herdIdSelected: herd.herdId, herdGotUpdated, claimReference, applicationReference })
        }

        await sendClaimConfirmationEmail(request, claim, application, { sbi, applicationReference, type, typeOfLivestock, dateOfVisit, amount, herdData })

        await sendMessage(
          {
            crn: application.dataValues.data.organisation.crn,
            sbi,
            agreementReference: applicationReference,
            claimReference,
            claimStatus: claim.dataValues.statusId,
            claimType: type,
            typeOfLivestock,
            reviewTestResults,
            piHuntRecommended: payload.data.piHuntRecommended,
            piHuntAllAnimals: payload.data.piHuntAllAnimals,
            dateTime: new Date(),
            herdName: herdData.herdName ?? getUnnamedHerdValue(payload)
          },
          messageGeneratorMsgType,
          messageGeneratorQueue,
          { sessionId: uuid() }
        )

        return h.response(claim).code(StatusCodes.OK)
      }
    }
  },
  {
    method: 'POST',
    path: '/api/claim/get-amount',
    options: {
      validate: {
        payload: joi.object({
          typeOfLivestock: joi.string().valid(livestockTypes.beef, livestockTypes.dairy, livestockTypes.pigs, livestockTypes.sheep).required(),
          reviewTestResults: joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).optional(),
          type: joi.string().valid(claimType.review, claimType.endemics).required(),
          piHunt: joi.string().valid(piHunt.yes, piHunt.no).optional(),
          piHuntAllAnimals: joi.string().valid(piHuntAllAnimals.yes, piHuntAllAnimals.no).optional(),
          dateOfVisit: joi.date().required()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })
          return h.response({ err }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const amount = await getAmount({ type: request.payload.type, data: request.payload })
        return h.response(amount).code(200)
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/claim/update-by-reference',
    options: {
      validate: {
        payload: joi.object({
          reference: joi.string().valid().required(),
          status: joi.number().required(),
          user: joi.string().required(),
          note: joi.string()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })

          return h.response({ err }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const { reference, status, note } = request.payload

        request.logger.setBindings({
          reference,
          status
        })

        const claim = await getClaimByReference(reference)
        if (!claim.dataValues) {
          return h.response('Not Found').code(404).takeover()
        }
        const { typeOfLivestock, reviewTestResults, vetVisitsReviewTestResults } = claim.dataValues.data || {}
        const applicationReference = claim.dataValues.applicationReference

        const application = await getApplication(applicationReference)
        const { sbi, frn, crn } = application?.dataValues?.data?.organisation || {}

        request.logger.setBindings({ sbi })

        await updateClaimByReference(
          {
            reference,
            statusId: status,
            updatedBy: request.payload.user,
            sbi
          },
          note,
          request.logger
        )

        await sendMessage(
          {
            crn,
            sbi,
            agreementReference: applicationReference,
            claimReference: reference,
            claimStatus: status,
            claimType: claim.dataValues.data.claimType,
            typeOfLivestock,
            reviewTestResults: reviewTestResults ?? vetVisitsReviewTestResults,
            piHuntRecommended: claim.dataValues.data.piHuntRecommended,
            piHuntAllAnimals: claim.dataValues.data.piHuntAllAnimals,
            dateTime: new Date(),
            herdName: claim.dataValues?.herd?.herdName || getUnnamedHerdValueByTypeOfLivestock(typeOfLivestock)
          },
          messageGeneratorMsgType,
          messageGeneratorQueue,
          { sessionId: uuid() }
        )

        if (status === applicationStatus.readyToPay) {
          let optionalPiHuntValue

          if (isVisitDateAfterPIHuntAndDairyGoLive(claim.dataValues.data.dateOfVisit)) {
            optionalPiHuntValue = claim.dataValues.data.piHunt === piHunt.yes && claim.dataValues.data.piHuntAllAnimals === piHuntAllAnimals.yes ? 'yesPiHunt' : 'noPiHunt'
          }

          await sendMessage(
            {
              reference,
              sbi,
              whichReview: typeOfLivestock,
              isEndemics: true,
              claimType: claim.dataValues.data.claimType,
              reviewTestResults: reviewTestResults ?? vetVisitsReviewTestResults,
              frn,
              optionalPiHuntValue
            },
            submitPaymentRequestMsgType,
            submitRequestQueue,
            { sessionId: uuid() }
          )
        }

        return h.response().code(200)
      }
    }
  }
]
