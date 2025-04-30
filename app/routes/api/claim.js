import Joi from 'joi'
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
  livestockToReadableSpecies
} from '../../constants/index.js'
import { setClaim, searchClaims, getClaimByReference, updateClaimByReference, getByApplicationReference, isURNNumberUnique } from '../../repositories/claim-repository.js'
import { getApplication } from '../../repositories/application-repository.js'
import { requestClaimConfirmationEmail } from '../../lib/request-email.js'
import { getAmount } from '../../lib/getAmount.js'
import { requiresComplianceCheck } from '../../lib/requires-compliance-check.js'
import { searchPayloadSchema } from './schema/search-payload.schema.js'
import { createClaimReference } from '../../lib/create-reference.js'
import { isPIHuntEnabledAndVisitDateAfterGoLive } from '../../lib/context-helper.js'
import { createHerd, getHerdById, updateIsCurrentHerd } from '../../repositories/herd-repository.js'
import { buildData } from '../../data/index.js'

const { sequelize } = buildData

const { submitPaymentRequestMsgType, submitRequestQueue, notify: { templateIdFarmerEndemicsReviewComplete, templateIdFarmerEndemicsFollowupComplete }, messageGeneratorMsgType, messageGeneratorQueue } = config

const isReview = (payload) => payload.type === claimType.review
const isFollowUp = (payload) => payload.type === claimType.endemics
const isPigs = (payload) => payload.data.typeOfLivestock === livestockTypes.pigs
const isBeef = (payload) => payload.data.typeOfLivestock === livestockTypes.beef
const isDairy = (payload) => payload.data.typeOfLivestock === livestockTypes.dairy
const isSheep = (payload) => payload.data.typeOfLivestock === livestockTypes.sheep
const isPositiveReviewTestResult = (payload) => payload.data.reviewTestResults === testResultsConstant.positive
const isPiHuntYes = (payload) => payload.data.piHunt === piHunt.yes
const isPiHuntRecommendedYes = (payload) => payload.data.piHuntRecommended === piHuntRecommended.yes

const getTestResultsValidation = (payload) => (pigsTestResults(payload) || sheepTestResults(payload) || beefDairyTestResults(payload))
const pigsTestResults = (payload) => isPigs(payload) && Joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required()
const sheepTestResults = (payload) => (isSheep(payload) && isFollowUp(payload)) && Joi.array().items(Joi.object({ diseaseType: Joi.string(), result: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.object({ diseaseType: Joi.string(), result: Joi.string() }))) })).required()
const beefDairyTestResults = (payload) => (isBeef(payload) || isDairy(payload)) && Joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required()

const getNumberAnimalsTestedValidation = (payload) => {
  const threshold = minimumNumberOfAnimalsTested[payload.data.typeOfLivestock][payload.type]
  return (isPigs(payload) && isFollowUp(payload)) ? Joi.number().valid(threshold) : Joi.number().min(threshold).required()
}

const getBiosecurityValidation = (payload) => pigsBiosecurity(payload) || beefDairyBiosecurity(payload)
const beefDairyBiosecurity = (payload) => (isBeef || isDairy) && isFollowUp(payload) && Joi.string().valid(biosecurity.yes, biosecurity.no).required()
const pigsBiosecurity = (payload) => (isPigs(payload) && isFollowUp(payload)) && Joi.alternatives().try(Joi.string().valid(biosecurity.no), Joi.object({ biosecurity: Joi.string().valid(biosecurity.yes), assessmentPercentage: Joi.string().pattern(/^(?!0$)(100|\d{1,2})$/) })).required()

const piHuntModel = (payload, laboratoryURN, testResults) => {
  const validations = {}

  if (isPositiveReviewTestResult(payload)) {
    validations.piHunt = Joi.string().valid(piHunt.yes, piHunt.no).required()
    Object.assign(validations, laboratoryURN)
    Object.assign(validations, testResults)
  }

  return validations
}

const optionalPiHuntModel = (payload, laboratoryURN, testResults, dateOfTesting) => {
  const validations = {}

  if (isPositiveReviewTestResult(payload)) {
    validations.piHunt = Joi.string().valid(piHunt.yes).required()
  } else {
    validations.piHunt = Joi.string().valid(piHunt.yes, piHunt.no).required()
  }

  if (isPiHuntYes(payload)) {
    if (isPositiveReviewTestResult(payload)) {
      validations.piHuntAllAnimals = Joi.string().valid(piHuntAllAnimals.yes).required()
    } else {
      validations.piHuntRecommended = Joi.string().valid(piHuntRecommended.yes, piHuntRecommended.no).required()

      if (isPiHuntRecommendedYes(payload)) {
        validations.piHuntAllAnimals = Joi.string().valid(piHuntAllAnimals.yes, piHuntAllAnimals.no).required()
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

const newHerd = Joi.object({
  herdId: Joi.string().required(),
  herdName: Joi.string().required(),
  cph: Joi.string().required(),
  herdReasons: Joi.array().required()
})
const updateHerd = Joi.object({
  herdId: Joi.string().required(),
  cph: Joi.string().required(),
  herdReasons: Joi.array().required()
})

const isClaimDataValid = (payload) => {
  const dateOfTesting = { dateOfTesting: Joi.date().required() }
  const laboratoryURN = { laboratoryURN: Joi.string().required() }
  const numberAnimalsTested = { numberAnimalsTested: getNumberAnimalsTestedValidation(payload) }
  const testResults = { testResults: getTestResultsValidation(payload) }
  const numberOfOralFluidSamples = { numberOfOralFluidSamples: Joi.number().min(minimumNumberOfOralFluidSamples).required() }
  const vetVisitsReviewTestResults = { vetVisitsReviewTestResults: Joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).optional() }
  const reviewTestResults = { reviewTestResults: Joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).required() }
  const piHunt = piHuntModel(payload, laboratoryURN, testResults)
  const herdVaccinationStatus = { herdVaccinationStatus: Joi.string().valid('vaccinated', 'notVaccinated').required() }
  const numberOfSamplesTested = { numberOfSamplesTested: Joi.number().valid(6, 30).required() }
  const diseaseStatus = { diseaseStatus: Joi.string().valid('1', '2', '3', '4').required() }
  const biosecurity = { biosecurity: getBiosecurityValidation(payload) }
  const sheepEndemicsPackage = { sheepEndemicsPackage: Joi.string().required() }
  const optionalPiHunt = optionalPiHuntModel(payload, laboratoryURN, testResults, dateOfTesting)

  const reviewValidations = { ...dateOfTesting, ...laboratoryURN }
  const beefReviewValidations = { ...numberAnimalsTested, ...testResults }
  const dairyReviewValidations = { ...testResults }
  const pigReviewValidations = { ...numberAnimalsTested, ...numberOfOralFluidSamples, ...testResults }
  const sheepReviewValidations = { ...numberAnimalsTested }

  const beefFollowUpValidations = { ...vetVisitsReviewTestResults, ...reviewTestResults, ...(!isPIHuntEnabledAndVisitDateAfterGoLive(payload.data.dateOfVisit) && isPositiveReviewTestResult(payload) && dateOfTesting), ...(!isPIHuntEnabledAndVisitDateAfterGoLive(payload.data.dateOfVisit) && piHunt), ...(isPIHuntEnabledAndVisitDateAfterGoLive(payload.data.dateOfVisit) && optionalPiHunt), ...biosecurity }
  const dairyFollowUpValidations = { ...vetVisitsReviewTestResults, ...reviewTestResults, ...(!isPIHuntEnabledAndVisitDateAfterGoLive(payload.data.dateOfVisit) && isPositiveReviewTestResult(payload) && dateOfTesting), ...(!isPIHuntEnabledAndVisitDateAfterGoLive(payload.data.dateOfVisit) && piHunt), ...(isPIHuntEnabledAndVisitDateAfterGoLive(payload.data.dateOfVisit) && optionalPiHunt), ...biosecurity }
  const pigFollowUpValidations = { ...vetVisitsReviewTestResults, ...reviewTestResults, ...dateOfTesting, ...numberAnimalsTested, ...herdVaccinationStatus, ...laboratoryURN, ...numberOfSamplesTested, ...diseaseStatus, ...biosecurity }
  const sheepFollowUpValidations = { ...dateOfTesting, ...numberAnimalsTested, ...sheepEndemicsPackage, ...testResults }

  const dataModel = Joi.object({
    amount: Joi.string().optional(),
    typeOfLivestock: Joi.string().valid(livestockTypes.beef, livestockTypes.dairy, livestockTypes.pigs, livestockTypes.sheep).required(),
    dateOfVisit: Joi.date().required(),
    speciesNumbers: Joi.string().valid(speciesNumbers.yes, speciesNumbers.no).required(),
    vetsName: Joi.string().required(),
    vetRCVSNumber: Joi.string().required(),
    ...(config.multiHerds.enabled && { herd: Joi.alternatives().try(updateHerd, newHerd).required() }),
    ...(isReview(payload) && reviewValidations),
    ...((isReview(payload) && isBeef(payload)) && beefReviewValidations),
    ...((isReview(payload) && isDairy(payload)) && dairyReviewValidations),
    ...((isReview(payload) && isPigs(payload)) && pigReviewValidations),
    ...((isReview(payload) && isSheep(payload)) && sheepReviewValidations),
    ...((isFollowUp(payload) && isBeef(payload)) && beefFollowUpValidations),
    ...((isFollowUp(payload) && isDairy(payload)) && dairyFollowUpValidations),
    ...((isFollowUp(payload) && isPigs(payload)) && pigFollowUpValidations),
    ...((isFollowUp(payload) && isSheep(payload)) && sheepFollowUpValidations)
  })

  const claimModel = Joi.object({
    applicationReference: Joi.string().required(),
    reference: Joi.string().required(),
    type: Joi.string().valid(claimType.review, claimType.endemics).required(),
    createdBy: Joi.string().required(),
    data: dataModel
  })

  return claimModel.validate(payload)
}

const arraysAreEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) {
    return false
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false
    }
  }

  return true
}

const hasHerdChanged = (existingHerd, updatedHerd) => existingHerd.cph !== updatedHerd.cph || arraysAreEqual(existingHerd.herdReasons, updatedHerd.herdReasons.sort())

const createOrUpdateHerd = async (herd, applicationReference, createdBy) => {
  let herdModel

  if (!herd.herdName) {
    // update herd
    const existingHerdModel = await getHerdById(herd.herdId)
    if (!existingHerdModel) {
      throw Error('Herd not found')
    }

    if (hasHerdChanged(existingHerdModel.dataValues, herd)) {
      const newVersion = existingHerdModel.dataValues.version + 1
      herdModel = await createHerd({
        version: newVersion,
        applicationReference,
        herdName: existingHerdModel.dataValues.herdName,
        cph: herd.cph,
        herdReasons: herd.herdReasons.sort(),
        createdBy
      })
      await updateIsCurrentHerd(herd.herdId, false)
    } else {
      console.log('Herd has not changed')
      herdModel = existingHerdModel
    }
  } else {
    // new herd
    herdModel = await createHerd({
      version: 1,
      applicationReference,
      herdName: herd.herdName,
      cph: herd.cph,
      herdReasons: herd.herdReasons.sort(),
      createdBy
    })
  }

  return herdModel
}

export const claimHandlers = [
  {
    method: 'GET',
    path: '/api/claim/get-by-reference/{ref}',
    options: {
      validate: {
        params: Joi.object({
          ref: Joi.string().valid()
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
        params: Joi.object({
          ref: Joi.string()
        }),
        query: Joi.object({
          typeOfLivestock: Joi.string().optional().valid(livestockTypes.beef, livestockTypes.dairy, livestockTypes.pigs, livestockTypes.sheep)
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
        payload: Joi.object({
          ...searchPayloadSchema,
          sort: Joi.object({
            field: Joi.string().valid().optional().allow(''),
            direction: Joi.string().valid().optional().allow(''),
            reference: Joi.string().valid().optional().allow('')
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
        payload: Joi.object({
          sbi: Joi.string().required(),
          laboratoryURN: Joi.string().required()
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
        const { error } = isClaimDataValid(request.payload)

        if (error) {
          request.logger.setBindings({ error })
          appInsights.defaultClient.trackException({ exception: error })
          return h.response({ error }).code(400).takeover()
        }

        const isFollowUp = request.payload.type === claimType.endemics
        const { payload } = request
        const applicationReference = payload?.applicationReference
        const tempClaimReference = payload?.reference
        const { type } = payload
        const { typeOfLivestock, dateOfVisit, reviewTestResults } = payload.data
        const claimReference = createClaimReference(tempClaimReference, type, typeOfLivestock)
        const laboratoryURN = payload?.data?.laboratoryURN

        request.logger.setBindings({
          isFollowUp,
          applicationReference,
          claimReference,
          laboratoryURN
        })
        const application = await getApplication(applicationReference)

        if (!application?.dataValues) {
          return h.response('Not Found').code(404).takeover()
        }

        const sbi = application.dataValues.data?.organisation?.sbi || 'not-found'

        request.logger.setBindings({ sbi })

        if (laboratoryURN) {
          const { isURNUnique } = await isURNNumberUnique(sbi, laboratoryURN)

          if (!isURNUnique) return h.response({ error: 'URN number is not unique' }).code(400).takeover()
        }

        const amount = await getAmount(request.payload)
        const { statusId } = await requiresComplianceCheck('claim')
        const { herd, ...payloadData } = payload.data
        let claim

        await sequelize.transaction(async () => {
          let claimHerdData = {}

          if (config.multiHerds.enabled) {
            const herdModel = await createOrUpdateHerd(herd, applicationReference, payload.createdBy)
            claimHerdData = {
              herdId: herdModel.dataValues.id,
              herdVersion: herdModel.dataValues.version,
              herdAssociatedAt: new Date().toISOString()
            }
          }
          const claimData = { ...payloadData, amount, claimType: request.payload.type, ...claimHerdData }
          claim = await setClaim({ ...payload, reference: claimReference, data: claimData, statusId, sbi })
        })

        if (!claim) {
          throw new Error('Claim was not created')
        }

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
          }
        },
        isFollowUp ? templateIdFarmerEndemicsFollowupComplete : templateIdFarmerEndemicsReviewComplete
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
              status: statusId,
              sbi,
              scheme: 'new-world'
            }
          })
        }

        await sendMessage(
          {
            crn: application?.dataValues?.data?.organisation?.crn,
            sbi,
            agreementReference: applicationReference,
            claimReference,
            claimStatus: statusId,
            claimType: type,
            typeOfLivestock,
            reviewTestResults,
            piHuntRecommended: payload.data.piHuntRecommended,
            piHuntAllAnimals: payload.data.piHuntAllAnimals,
            dateTime: new Date()
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
        payload: Joi.object({
          typeOfLivestock: Joi.string().valid(livestockTypes.beef, livestockTypes.dairy, livestockTypes.pigs, livestockTypes.sheep).required(),
          reviewTestResults: Joi.string().valid(testResultsConstant.positive, testResultsConstant.negative).optional(),
          type: Joi.string().valid(claimType.review, claimType.endemics).required(),
          piHunt: Joi.string().valid(piHunt.yes, piHunt.no).optional(),
          piHuntAllAnimals: Joi.string().valid(piHuntAllAnimals.yes, piHuntAllAnimals.no).optional(),
          dateOfVisit: Joi.date().required()
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
        payload: Joi.object({
          reference: Joi.string().valid().required(),
          status: Joi.number().required(),
          user: Joi.string().required(),
          note: Joi.string()
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
            dateTime: new Date()
          },
          messageGeneratorMsgType,
          messageGeneratorQueue,
          { sessionId: uuid() }
        )

        if (status === applicationStatus.readyToPay) {
          let optionalPiHuntValue

          if (isPIHuntEnabledAndVisitDateAfterGoLive(claim.dataValues.data.dateOfVisit)) {
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
