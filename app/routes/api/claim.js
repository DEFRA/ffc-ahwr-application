import joi from 'joi'
import { v4 as uuid } from 'uuid'
import appInsights from 'applicationinsights'
import { sendMessage } from '../../messaging/send-message.js'
import { config } from '../../config/index.js'
import {
  speciesNumbers,
  biosecurity,
  minimumNumberOfAnimalsTested,
  piHunt,
  piHuntRecommended,
  piHuntAllAnimals,
  minimumNumberOfOralFluidSamples,
  testResults as testResultsConstant,
  livestockTypes,
  claimType,
  applicationStatus,
  livestockToReadableSpecies,
  UNNAMED_FLOCK,
  UNNAMED_HERD
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
import { herdSchema } from './schema/herd.schema.js'
import { arraysAreEqual } from '../../lib/array-utils.js'
import { emitHerdMIEvents } from '../../lib/emit-herd-MI-events.js'
import { PIG_GENETIC_SEQUENCING_VALUES } from 'ffc-ahwr-common-library'

const { sequelize } = buildData

const { submitPaymentRequestMsgType, submitRequestQueue, notify: { templateIdFarmerEndemicsReviewComplete, templateIdFarmerEndemicsFollowupComplete }, messageGeneratorMsgType, messageGeneratorQueue } = config

const POSITIVE_SAMPLE_REQ = 6
const NEGATIVE_SAMPLE_REQ = 30
const isReview = (payload) => payload.type === claimType.review
const isFollowUp = (payload) => payload.type === claimType.endemics
const isPigs = (payload) => payload.data.typeOfLivestock === livestockTypes.pigs
const isBeef = (payload) => payload.data.typeOfLivestock === livestockTypes.beef
const isDairy = (payload) => payload.data.typeOfLivestock === livestockTypes.dairy
const isSheep = (payload) => payload.data.typeOfLivestock === livestockTypes.sheep
const isPositiveReviewTestResult = (payload) => payload.data.reviewTestResults === testResultsConstant.positive
const isPiHuntYes = (payload) => payload.data.piHunt === piHunt.yes
const isPiHuntRecommendedYes = (payload) => payload.data.piHuntRecommended === piHuntRecommended.yes
const getHerdNameLabel = (payload) => isSheep(payload) ? 'Flock name' : 'Herd name'
const getUnnamedHerdValue = (payload) => isSheep(payload) ? UNNAMED_FLOCK : UNNAMED_HERD
const getUnnamedHerdValueByTypeOfLivestock = (typeOfLivestock) => typeOfLivestock === livestockTypes.sheep ? UNNAMED_FLOCK : UNNAMED_HERD

const getTestResultsValidation = (payload) => (pigsTestResults(payload) || sheepTestResults(payload) || beefDairyTestResults(payload))
const pigsTestResults = (payload) => isPigs(payload) && joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required()
const sheepTestResults = (payload) => (isSheep(payload) && isFollowUp(payload)) && joi.array().items(joi.object({ diseaseType: joi.string(), result: joi.alternatives().try(joi.string(), joi.array().items(joi.object({ diseaseType: joi.string(), result: joi.string() }))) })).required()
const beefDairyTestResults = (payload) => (isBeef(payload) || isDairy(payload)) && joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required()

const getNumberAnimalsTestedValidation = (payload) => {
  const threshold = minimumNumberOfAnimalsTested[payload.data.typeOfLivestock][payload.type]
  return (isPigs(payload) && isFollowUp(payload)) ? joi.number().valid(threshold) : joi.number().min(threshold).required()
}

const getBiosecurityValidation = (payload) => pigsBiosecurity(payload) || beefDairyBiosecurity(payload)
const beefDairyBiosecurity = (payload) => (isBeef || isDairy) && isFollowUp(payload) && joi.string().valid(biosecurity.yes, biosecurity.no).required()
const pigsBiosecurity = (payload) => (isPigs(payload) && isFollowUp(payload)) && joi.alternatives().try(joi.string().valid(biosecurity.no), joi.object({ biosecurity: joi.string().valid(biosecurity.yes), assessmentPercentage: joi.string().pattern(/^(?!0$)(100|\d{1,2})$/) })).required()

const piHuntModel = (payload, laboratoryURN, testResults) => {
  const validations = {}

  if (isPositiveReviewTestResult(payload)) {
    validations.piHunt = joi.string().valid(piHunt.yes, piHunt.no).required()
    Object.assign(validations, laboratoryURN)
    Object.assign(validations, testResults)
  }

  return validations
}

const optionalPiHuntModel = (payload, laboratoryURN, testResults, dateOfTesting) => {
  const validations = {}

  if (isPositiveReviewTestResult(payload)) {
    validations.piHunt = joi.string().valid(piHunt.yes).required()
  } else {
    validations.piHunt = joi.string().valid(piHunt.yes, piHunt.no).required()
  }

  if (isPiHuntYes(payload)) {
    if (isPositiveReviewTestResult(payload)) {
      validations.piHuntAllAnimals = joi.string().valid(piHuntAllAnimals.yes).required()
    } else {
      validations.piHuntRecommended = joi.string().valid(piHuntRecommended.yes, piHuntRecommended.no).required()

      if (isPiHuntRecommendedYes(payload)) {
        validations.piHuntAllAnimals = joi.string().valid(piHuntAllAnimals.yes, piHuntAllAnimals.no).required()
      }
    }

    if (payload.data.piHuntRecommended !== piHuntRecommended.no && payload.data.piHuntAllAnimals === piHuntAllAnimals.yes) {
      Object.assign(validations, laboratoryURN)
      Object.assign(validations, testResults)
      Object.assign(validations, dateOfTesting)
    }
  }

  return validations
}

const getSpecificValidationsForClaimType = (payload) => {
  const dateOfTesting = { dateOfTesting: joi.date().required() }
  const laboratoryURN = { laboratoryURN: joi.string().required() }
  const numberAnimalsTested = { numberAnimalsTested: getNumberAnimalsTestedValidation(payload) }
  const testResults = { testResults: getTestResultsValidation(payload) }
  const numberOfOralFluidSamples = { numberOfOralFluidSamples: joi.number().min(minimumNumberOfOralFluidSamples).required() }
  const vetVisitsReviewTestResults = { vetVisitsReviewTestResults: joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).optional() }
  const reviewTestResults = { reviewTestResults: joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required() }
  const piHunt = piHuntModel(payload, laboratoryURN, testResults)
  const herdVaccinationStatus = { herdVaccinationStatus: joi.string().valid('vaccinated', 'notVaccinated').required() }
  const numberOfSamplesTested = { numberOfSamplesTested: joi.number().valid(POSITIVE_SAMPLE_REQ, NEGATIVE_SAMPLE_REQ).required() }
  const diseaseStatus = { diseaseStatus: joi.string().valid('1', '2', '3', '4') }
  const pigsFollowUpTest = { pigsFollowUpTest: joi.string().valid('pcr', 'elisa') }
  const pigsPcrTestResult = { pigsPcrTestResult: joi.string().when('pigsFollowUpTest', { is: 'pcr', then: joi.string().valid('positive', 'negative').required() }) }
  const pigsElisaTestResult = { pigsElisaTestResult: joi.string().when('pigsFollowUpTest', { is: 'elisa', then: joi.string().valid('positive', 'negative').required() }) }
  const pigsGeneticSequencing = { pigsGeneticSequencing: joi.string().when('pigsPcrTestResult', { is: 'positive', then: joi.valid(...PIG_GENETIC_SEQUENCING_VALUES.map(x => x.value)).required() }) }
  const biosecurity = { biosecurity: getBiosecurityValidation(payload) }
  const sheepEndemicsPackage = { sheepEndemicsPackage: joi.string().required() }
  const optionalPiHunt = optionalPiHuntModel(payload, laboratoryURN, testResults, dateOfTesting)

  const beefFollowUpValidations = { ...vetVisitsReviewTestResults, ...reviewTestResults, ...(!isVisitDateAfterPIHuntAndDairyGoLive(payload.data.dateOfVisit) && isPositiveReviewTestResult(payload) && dateOfTesting), ...(!isVisitDateAfterPIHuntAndDairyGoLive(payload.data.dateOfVisit) && piHunt), ...(isVisitDateAfterPIHuntAndDairyGoLive(payload.data.dateOfVisit) && optionalPiHunt), ...biosecurity }
  const dairyFollowUpValidations = { ...vetVisitsReviewTestResults, ...reviewTestResults, ...(!isVisitDateAfterPIHuntAndDairyGoLive(payload.data.dateOfVisit) && isPositiveReviewTestResult(payload) && dateOfTesting), ...(!isVisitDateAfterPIHuntAndDairyGoLive(payload.data.dateOfVisit) && piHunt), ...(isVisitDateAfterPIHuntAndDairyGoLive(payload.data.dateOfVisit) && optionalPiHunt), ...biosecurity }
  const pigFollowUpValidations = { ...vetVisitsReviewTestResults, ...reviewTestResults, ...dateOfTesting, ...numberAnimalsTested, ...herdVaccinationStatus, ...laboratoryURN, ...numberOfSamplesTested, ...diseaseStatus, ...pigsFollowUpTest, ...pigsPcrTestResult, ...pigsElisaTestResult, ...pigsGeneticSequencing, ...biosecurity }
  const sheepFollowUpValidations = { ...dateOfTesting, ...numberAnimalsTested, ...sheepEndemicsPackage, ...testResults }

  const getReviewValidations = () => {
    const base = { ...dateOfTesting, ...laboratoryURN }
    if (isBeef(payload)) { return { ...base, ...numberAnimalsTested, ...testResults } }
    if (isDairy(payload)) { return { ...base, ...testResults } }
    if (isPigs(payload)) { return { ...base, ...numberAnimalsTested, ...numberOfOralFluidSamples, ...testResults } }
    if (isSheep(payload)) { return { ...base, ...numberAnimalsTested } }
    return base
  }

  const getFollowUpValidations = () => {
    if (isBeef(payload)) { return beefFollowUpValidations }
    if (isDairy(payload)) { return dairyFollowUpValidations }
    if (isPigs(payload)) { return pigFollowUpValidations }
    if (isSheep(payload)) { return sheepFollowUpValidations }
    return {}
  }

  return isReview(payload) ? getReviewValidations() : getFollowUpValidations()
}

export const isClaimDataValid = (payload, agreementFlags) => {
  const dataModel = joi.object({
    amount: joi.string().optional(),
    typeOfLivestock: joi.string().valid(livestockTypes.beef, livestockTypes.dairy, livestockTypes.pigs, livestockTypes.sheep).required(),
    dateOfVisit: joi.date().required(),
    speciesNumbers: joi.string().valid(speciesNumbers.yes, speciesNumbers.no).required(),
    vetsName: joi.string().required(),
    vetRCVSNumber: joi.string().required(),
    ...getSpecificValidationsForClaimType(payload),
    ...(isMultipleHerdsUserJourney(payload.data.dateOfVisit, agreementFlags) && herdSchema)
  })

  let claimModel = joi.object({
    applicationReference: joi.string().required(),
    reference: joi.string().required(),
    type: joi.string().valid(claimType.review, claimType.endemics).required(),
    createdBy: joi.string().required(),
    data: dataModel
  })

  // Note this, along with all the rest of this validation needs pulling out of here ASAP. but not doing it in this ticket
  if (isFollowUp(payload) && isPigs(payload)) {
    if (config.pigUpdates.enabled === false) {
      claimModel = claimModel.fork(['data.diseaseStatus'], (x) => { return x.required() })
    } else {
      claimModel = claimModel.fork(['data.pigsFollowUpTest'], (x) => { return x.required() })
    }
  }

  return claimModel.validate(payload)
}

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
    email: application.dataValues.data?.organisation?.email,
    farmerName: application.dataValues.data?.organisation?.farmerName,
    species: livestockToReadableSpecies[typeOfLivestock],
    orgData: {
      orgName: application.dataValues.data?.organisation?.name,
      orgEmail: application.dataValues.data?.organisation?.orgEmail,
      crn: application.dataValues.data?.organisation?.crn,
      sbi: application.dataValues.data?.organisation?.sbi
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
          return h.response('Not Found').code(404).takeover()
        }

        const { error } = isClaimDataValid(request.payload, application.dataValues.flags)
        if (error) {
          request.logger.setBindings({ error })
          appInsights.defaultClient.trackException({ exception: error })
          return h.response({ error }).code(400).takeover()
        }

        const tempClaimReference = payload?.reference
        const { type } = payload
        const { typeOfLivestock, dateOfVisit, reviewTestResults, herd } = payload.data
        const claimReference = createClaimReference(tempClaimReference, type, typeOfLivestock)
        const laboratoryURN = payload?.data?.laboratoryURN

        request.logger.setBindings({
          isFollowUp: isFollowUp(payload),
          applicationReference,
          claimReference,
          laboratoryURN
        })

        const sbi = application.dataValues.data?.organisation?.sbi || 'not-found'

        request.logger.setBindings({ sbi })

        if (laboratoryURN) {
          const { isURNUnique } = await isURNNumberUnique(sbi, laboratoryURN)
          if (!isURNUnique) return h.response({ error: 'URN number is not unique' }).code(400).takeover()
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
            crn: application?.dataValues?.data?.organisation?.crn,
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

        return h.response(claim).code(200)
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
