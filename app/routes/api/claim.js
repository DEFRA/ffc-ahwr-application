const Joi = require('joi')
const { v4: uuid } = require('uuid')
const sendMessage = require('../../messaging/send-message')
const { submitPaymentRequestMsgType, submitRequestQueue } = require('../../config')
const { templateIdFarmerEndemicsReviewComplete, templateIdFarmerEndemicsFollowupComplete } = require('../../config').notify
const appInsights = require('applicationinsights')
const { speciesNumbers, biosecurity, minimumNumberOfAnimalsTested, piHunt, piHuntRecommended, piHuntAllAnimals, claimType: { review, endemics }, minimumNumberOfOralFluidSamples, testResults: { positive, negative }, livestockTypes: { beef, dairy, pigs, sheep }, testResults, biosecurity } = require('../../constants/claim')
const { set, searchClaims, getByReference, updateByReference, getByApplicationReference, isURNNumberUnique } = require('../../repositories/claim-repository')
const statusIds = require('../../constants/application-status')
const { get } = require('../../repositories/application-repository')
const { sendFarmerEndemicsClaimConfirmationEmail } = require('../../lib/send-email')
const { getBlob } = require('../../storage')
const { getAmount } = require('../../lib/getAmount')
const requiresComplianceCheck = require('../../lib/requires-compliance-check')
const { searchPayloadValidations } = require('./helpers')

const isReview = (payload) => payload.type === review
const isFollowUp = (payload) => payload.type === endemics
const isPigs = (payload) => payload.data.typeOfLivestock === pigs
const isBeef = (payload) => payload.data.typeOfLivestock === beef
const isDairy = (payload) => payload.data.typeOfLivestock === dairy
const isSheep = (payload) => payload.data.typeOfLivestock === sheep
const isPositiveReviewTestResult = (payload) => payload.data.reviewTestResults === 'positive'
const isPiHuntYes = (payload) => payload.data.piHunt === piHunt.yes
const isPiHuntRecommendedYes = (payload) => payload.data.piHuntRecommended === piHuntRecommended.yes

const getTestResultsValidation = (payload) => (pigsTestResults(payload) || sheepTestResults(payload) || beefDairyTestResults(payload))
const pigsTestResults = (payload) => isPigs(payload) && Joi.string().valid(positive, negative).required()
const sheepTestResults = (payload) => (isSheep(payload) && isFollowUp(payload)) && Joi.array().items(Joi.object({ diseaseType: Joi.string(), result: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.object({ diseaseType: Joi.string(), result: Joi.string() }))) })).required()
const beefDairyTestResults = (payload) => (isBeef || isDairy) && Joi.string().valid(positive, negative).required()

const getNumberAnimalsTestedValidation = (payload) => {
  const threshold = minimumNumberOfAnimalsTested[payload.data.typeOfLivestock][payload.type]
  return (isPigs(payload) && isFollowUp(payload)) ? Joi.number().valid(threshold) : Joi.number().min(threshold).required()
}

const getBiosecurityValidation = (payload) => pigsBiosecurity(payload) || beefDairyBiosecurity(payload)
const beefDairyBiosecurity = (payload) => (isBeef || isDairy) && isFollowUp(payload) && Joi.string().valid(biosecurity.yes, biosecurity.no).required()
const pigsBiosecurity = (payload) => (isPigs(payload) && isFollowUp(payload)) && Joi.alternatives().try(Joi.string().valid(biosecurity.no), Joi.object({ biosecurity: Joi.string().valid(biosecurity.yes), assessmentPercentage: Joi.string().pattern(/^(?!0$)(100|\d{1,2})$/) })).required()

const optionalPiHuntModel = (payload, laboratoryURN, testResults, biosecurity) => {
  const validations = []

  if (isPositiveReviewTestResult(payload)) {
    validations.push({ piHunt: Joi.string().valid(piHunt.yes).required() })
  } else {
    validations.push({ piHunt: Joi.string().valid(piHunt.yes, piHunt.no).required() })
  }

  if (isPiHuntYes(payload)) {
    if (isPositiveReviewTestResult(payload)) {
      validations.push({ piHuntAllAnimals: Joi.string().valid(piHuntAllAnimals.yes, piHuntAllAnimals.no).required() })
    } else {
      validations.push({ piHuntRecommended: Joi.string().valid(piHuntRecommended.yes, piHuntRecommended.no).required() })

      if (isPiHuntRecommendedYes(payload)) {
        validations.push({ piHuntAllAnimals: Joi.string().valid(piHuntAllAnimals.yes, piHuntAllAnimals.no).required() })
      }
    }

    if (payload.data.piHuntRecommended !== piHuntRecommended.no && payload.data.piHuntAllAnimals === piHuntAllAnimals.yes) {
      validations.push(laboratoryURN)
      validations.push(testResults)
    }

    validations.push(biosecurity)
  }

  return validations
}

const isClaimDataValid = (payload) => {
  const dateOfTesting = { dateOfTesting: Joi.date().required() }
  const laboratoryURN = { laboratoryURN: Joi.string().required() }
  const numberAnimalsTested = { numberAnimalsTested: getNumberAnimalsTestedValidation(payload) }
  const testResults = { testResults: getTestResultsValidation(payload) }
  const numberOfOralFluidSamples = { numberOfOralFluidSamples: Joi.number().min(minimumNumberOfOralFluidSamples).required() }
  const vetVisitsReviewTestResults = { vetVisitsReviewTestResults: Joi.string().valid(positive, negative).optional() }
  const reviewTestResults = { reviewTestResults: Joi.string().valid(positive, negative).required() }
  const optionalPiHunt = optionalPiHuntModel(payload, laboratoryURN, testResults, biosecurity)
  const herdVaccinationStatus = { herdVaccinationStatus: Joi.string().valid('vaccinated', 'notVaccinated').required() }
  const numberOfSamplesTested = { numberOfSamplesTested: Joi.number().valid(6, 30).required() }
  const diseaseStatus = { diseaseStatus: Joi.string().valid('1', '2', '3', '4').required() }
  const biosecurity = { biosecurity: getBiosecurityValidation(payload) }
  const sheepEndemicsPackage = { sheepEndemicsPackage: Joi.string().required() }

  const reviewValidations = { ...dateOfTesting, ...laboratoryURN }
  const beefReviewValidations = { ...numberAnimalsTested, ...testResults }
  const dairyReviewValidations = { ...testResults }
  const pigReviewValidations = { ...numberOfOralFluidSamples, ...testResults }
  const sheepReviewValidations = { ...numberAnimalsTested }

  const beefFollowUpValidations = { ...vetVisitsReviewTestResults, ...reviewTestResults, ...optionalPiHunt }
  const dairyFollowUpValidations = { ...vetVisitsReviewTestResults, ...reviewTestResults, ...optionalPiHunt }
  const pigFollowUpValidations = { ...vetVisitsReviewTestResults, ...reviewTestResults, ...dateOfTesting, ...numberAnimalsTested, ...herdVaccinationStatus, ...laboratoryURN, ...numberOfSamplesTested, ...diseaseStatus, ...biosecurity }
  const sheepFollowUpValidations = { ...dateOfTesting, ...numberAnimalsTested, ...sheepEndemicsPackage, ...testResults}


  const dataModel = Joi.object({
    amount: Joi.string().optional(),
    typeOfLivestock: Joi.string().valid(beef, dairy, pigs, sheep).required(),
    dateOfVisit: Joi.date().required(),
    speciesNumbers: Joi.string().valid(speciesNumbers.yes, speciesNumbers.no).required(),
    vetsName: Joi.string().required(),
    vetRCVSNumber: Joi.string().required(),
    ...(isReview(payload) && reviewValidations),
    ...((isReview(payload) && isBeef(payload)) && beefReviewValidations),
    ...((isReview(payload) && isDairy(payload)) && dairyReviewValidations),
    ...((isReview(payload) && isPigs(payload)) && pigReviewValidations),
    ...((isReview(payload) && isSheep(payload)) && sheepReviewValidations),
    ...((isFollowUp(payload) && isBeef(payload)) && beefFollowUpValidations),
    ...((isFollowUp(payload) && isDairy(payload)) && dairyFollowUpValidations),
    ...((isFollowUp(payload) && isPigs(payload)) && pigFollowUpValidations),
    ...((isFollowUp(payload) && isSheep(payload)) && sheepFollowUpValidations),
  })

  const claimModel = Joi.object({
    applicationReference: Joi.string().required(),
    type: Joi.string().valid(review, endemics).required(),
    createdBy: Joi.string().required(),
    data: dataModel,
  })

  return claimModel.validate(payload)
}

module.exports = [
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
        const claim = await getByReference(request.params.ref)
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
          ref: Joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const claims = await getByApplicationReference(request.params.ref)

        if (claims.length) {
          return h.response(claims).code(200)
        } else {
          return h.response('Not Found').code(404).takeover()
        }
      }
    }
  }, {
    method: 'POST',
    path: '/api/claim/search',
    options: {
      validate: {
        payload: Joi.object({
          ...searchPayloadValidations(),
          sort: Joi.object({
            field: Joi.string().valid().optional().allow(''),
            direction: Joi.string().valid().optional().allow('')
          }).optional()
        }),
        failAction: async (_request, h, err) => {
          return h.response({ err }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const { total, claims } = await searchClaims(request.payload.search.text ?? '', request.payload.search.type, request.payload.offset, request.payload.limit, request.payload.sort)
        return h.response({ total, claims }).code(200)
      }
    }
  }, {
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
        const isReviewClaim = isReview(request.payload)
        const isEndemicsFollowUpClaim = isFollowUp(request.payload)
        if (error) {
          console.error(error)
          appInsights.defaultClient.trackException({ exception: error })
          return h.response({ error }).code(400).takeover()
        }

        const data = request.payload
        const applicationReference = data?.applicationReference
        const laboratoryURN = data?.data?.laboratoryURN

        const application = await get(applicationReference)

        if (!application?.dataValues) {
          return h.response('Not Found').code(404).takeover()
        }

        const claimPricesConfig = await getBlob('claim-prices-config.json')
        const sbi = application?.dataValues?.data?.organisation?.sbi || 'not-found'

        if (laboratoryURN) {
          const { isURNUnique } = await isURNNumberUnique(sbi, laboratoryURN)

          if (!isURNUnique) return h.response({ error: 'URN number is not unique' }).code(400).takeover()
        }

        const amount = getAmount(data.data.typeOfLivestock, data.data.reviewTestResults, claimPricesConfig, isReviewClaim, isEndemicsFollowUpClaim)
        const { statusId } = await requiresComplianceCheck('claim')
        const claim = await set({ ...data, data: { ...data?.data, amount, claimType: request.payload.type }, statusId, sbi })
        claim && (await sendFarmerEndemicsClaimConfirmationEmail({
          reference: claim?.dataValues?.reference,
          applicationReference: claim?.dataValues?.applicationReference,
          amount,
          email: application?.dataValues?.data?.organisation?.email,
          farmerName: application?.dataValues?.data?.organisation?.farmerName,
          orgData: {
            orgName: application?.dataValues?.data?.organisation?.name,
            orgEmail: application?.dataValues?.data?.organisation?.orgEmail
          }
        },
        isEndemicsFollowUpClaim ? templateIdFarmerEndemicsFollowupComplete : templateIdFarmerEndemicsReviewComplete
        ))
        return h.response(claim).code(200)
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
          status: Joi.number().valid(5, 9, 10).required(),
          user: Joi.string().required()
        }),
        failAction: async (_request, h, err) => {
          console.log(`Payload validation error ${err}`)
          return h.response({ err }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const claim = await getByReference(request.payload.reference)
        if (!claim.dataValues) {
          return h.response('Not Found').code(404).takeover()
        }
        const application = await get(claim.dataValues.applicationReference)
        const sbi = application?.dataValues?.data?.organisation?.sbi

        if (request.payload.status === statusIds.readyToPay) {
          await sendMessage(
            {
              reference: request.payload.reference,
              sbi: application.dataValues.data.organisation.sbi,
              whichReview: claim.dataValues.data.typeOfLivestock,
              isEndemics: true,
              claimType: claim.dataValues.data?.claimType,
              reviewTestResults: claim.dataValues.data.reviewTestResults,
              frn: application.dataValues.data.organisation.frn
            },
            submitPaymentRequestMsgType,
            submitRequestQueue,
            { sessionId: uuid() }
          )
        }

        await updateByReference({ reference: request.payload.reference, statusId: request.payload.status, updatedBy: request.payload.user, sbi })

        console.log(`Status of claim with reference ${request.payload.reference} successfully updated to ${request.payload.status}`)

        return h.response().code(200)
      }
    }
  }
]
