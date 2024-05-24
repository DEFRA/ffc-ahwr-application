const Joi = require('joi')
const { v4: uuid } = require('uuid')
const sendMessage = require('../../messaging/send-message')
const { submitPaymentRequestMsgType, submitRequestQueue } = require('../../config')
const appInsights = require('applicationinsights')
const { speciesNumbers: { yes, no }, biosecurity, minimumNumberOfAnimalsTested, claimType: { review, endemics }, minimumNumberOfOralFluidSamples, testResults: { positive, negative }, livestockTypes: { beef, dairy, pigs, sheep } } = require('../../constants/claim')
const { set, getByReference, updateByReference, getByApplicationReference, isURNNumberUnique } = require('../../repositories/claim-repository')
const statusIds = require('../../constants/application-status')
const { get } = require('../../repositories/application-repository')
const { sendFarmerEndemicsClaimConfirmationEmail } = require('../../lib/send-email')
const { getBlob } = require('../../storage')
const { getAmount } = require('../../lib/getAmount')
// const requiresComplianceCheck = require('../../lib/requires-compliance-check')

const isReview = (payload) => payload.type === review
const isEndemicsFollowUp = (payload) => payload.type === endemics
const isPigs = (payload) => payload.data.typeOfLivestock === pigs
const isBeef = (payload) => payload.data.typeOfLivestock === beef
const isSheep = (payload) => payload.data.typeOfLivestock === sheep
const isPigsReview = (payload) => isPigs(payload) && isReview(payload)
const isPigsEndemics = (payload) => isPigs(payload) && isEndemicsFollowUp(payload)
const isSheepEndemics = (payload) => isSheep(payload) && isEndemicsFollowUp(payload)
const isBeefEndemics = (payload) => isBeef(payload) && isEndemicsFollowUp(payload)
const isPositiveReviewTestResult = (payload) => payload.data.reviewTestResults === 'positive'
const isNegativeReviewTestResult = (payload) => payload.data.reviewTestResults === 'negative'
const isPositiveBeefReviewTestResult = (payload) => isBeefEndemics(payload) && isPositiveReviewTestResult(payload)
const isNegativeBeefReviewTestResult = (payload) => isBeefEndemics(payload) && isNegativeReviewTestResult(payload)

const pigsTestResults = (payload) => isPigsReview(payload) && Joi.string().valid(positive, negative).required()
const sheepTestResults = (payload) => isSheepEndemics(payload) && Joi.array().items(Joi.object({ diseaseType: Joi.string(), result: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.object({ diseaseType: Joi.string(), result: Joi.string() }))) })).required()
const beefDairyTestResults = (payload) => [beef, dairy].includes(payload.data.typeOfLivestock) && Joi.string().valid(positive, negative).required()
const beefDairyBiosecurity = (payload) => [beef, dairy].includes(payload.data.typeOfLivestock) && isEndemicsFollowUp(payload) && Joi.string().valid(biosecurity.yes, biosecurity.no).required()
const pigsBiosecurity = (payload) => isPigsEndemics(payload) && Joi.alternatives().try(Joi.string().valid(biosecurity.no), Joi.object({ biosecurity: Joi.string().valid(biosecurity.yes), assessmentPercentage: Joi.string().pattern(/^(?!0$)(100|\d{1,2})$/) })).required()
const isBiosecurityValid = (payload) => pigsBiosecurity(payload) || beefDairyBiosecurity(payload)
const isTestResultValid = (payload) => !isNegativeBeefReviewTestResult(payload) && (pigsTestResults(payload) || sheepTestResults(payload) || beefDairyTestResults(payload))

const isClaimDataValid = (payload) => {
  const claimDataModel = Joi.object({
    applicationReference: Joi.string().required(),
    type: Joi.string().valid(review, endemics).required(),
    createdBy: Joi.string().required(),
    data: Joi.object({
      amount: Joi.string().optional(),
      vetsName: Joi.string().required(),
      dateOfVisit: Joi.date().required(),
      vetRCVSNumber: Joi.string().required(),
      speciesNumbers: Joi.string().valid(yes, no).required(),
      typeOfLivestock: Joi.string().valid(beef, dairy, pigs, sheep).required(),
      ...(isSheepEndemics(payload) && { sheepEndemicsPackage: Joi.string().required() }),
      ...(!isNegativeBeefReviewTestResult(payload) && { dateOfTesting: Joi.date().required() }),
      ...(isPigsEndemics(payload) && { numberOfSamplesTested: Joi.number().valid(6, 30).required() }),
      ...(isPositiveBeefReviewTestResult(payload) && { piHunt: Joi.string().valid(yes, no).required() }),
      ...(isPigsEndemics(payload) && { diseaseStatus: Joi.string().valid('1', '2', '3', '4').required() }),
      ...(!!isBiosecurityValid(payload) && { biosecurity: pigsBiosecurity(payload) || beefDairyBiosecurity(payload) }),
      ...(isPigsEndemics(payload) && { herdVaccinationStatus: Joi.string().valid('vaccinated', 'notVaccinated').required() }),
      ...(!isNegativeBeefReviewTestResult(payload) && !isSheepEndemics(payload) && { laboratoryURN: Joi.string().required() }),
      ...(isPigsReview(payload) && { numberOfOralFluidSamples: Joi.number().min(minimumNumberOfOralFluidSamples).required() }),
      ...(!!isTestResultValid(payload) && { testResults: pigsTestResults(payload) || sheepTestResults(payload) || beefDairyTestResults(payload) }),
      ...([beef, dairy, pigs].includes(payload.data.typeOfLivestock) && { vetVisitsReviewTestResults: Joi.string().valid(positive, negative).optional() }),
      ...([beef, dairy, pigs].includes(payload.data.typeOfLivestock) && isEndemicsFollowUp(payload) && { reviewTestResults: Joi.string().valid(positive, negative).required() }),
      ...(!isNegativeBeefReviewTestResult(payload) && [beef, sheep, pigs].includes(payload.data.typeOfLivestock) && { numberAnimalsTested: Joi.number().min(minimumNumberOfAnimalsTested[payload.data.typeOfLivestock][payload.type]).required() })
    })
  })

  return claimDataModel.validate(payload)
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
        const { error, value: data } = isClaimDataValid(request.payload)
        const applicationReference = data?.applicationReference
        const laboratoryURN = data?.data?.laboratoryURN

        if (error) {
          appInsights.defaultClient.trackException({ exception: error })
          return h.response({ error }).code(400).takeover()
        }

        const application = await get(applicationReference)

        if (!application?.dataValues) {
          return h.response('Not Found').code(404).takeover()
        }
        const claimPricesConfig = await getBlob('claim-prices-config.json')

        if (laboratoryURN) {
          const sbi = application?.dataValues?.data?.organisation?.sbi
          const { isURNUnique } = await isURNNumberUnique(sbi, laboratoryURN)

          if (!isURNUnique) return h.response({ error: 'URN number is not unique' }).code(400).takeover()
        }
        console.log('>>>>>>>>>>>>>>>', getAmount(data.data.typeOfLivestock, data.data.testResults, claimPricesConfig))
        // const { statusId } = await requiresComplianceCheck('claim')
        // TODO: Currently claim status by default is in check but in future, We should use requiresComplianceCheck('claim')
        // TODO: This file has been excluded from sonarcloud as it is a temporary solution, We should remove this exclusion in future
        const claim = await set({ ...data, data: { ...data?.data, reviewTestResults: undefined }, statusId: statusIds.inCheck })
        const amount = getAmount(data.data.typeOfLivestock, data.data.testResults, claimPricesConfig)
        claim && (await sendFarmerEndemicsClaimConfirmationEmail({
          reference: claim?.dataValues?.reference,
          amount,
          email: application?.dataValues?.data?.email,
          farmerName: application?.dataValues?.data?.farmerName,
          orgData: {
            orgName: application?.dataValues?.data?.organisation?.name,
            orgEmail: application?.dataValues?.data?.organisation?.orgEmail
          }
        }))

        return h.response({ ...claim, amount }).code(200)
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

        if (request.payload.status === statusIds.readyToPay) {
          const application = await get(claim.dataValues.applicationReference)

          await sendMessage(
            {
              reference: request.payload.reference,
              sbi: application.dataValues.data.organisation.sbi,
              whichReview: claim.dataValues.data.typeOfLivestock,
              isEndemics: true,
              testResults: claim.dataValues.data.testResults,
              frn: application.dataValues.data.organisation.frn
            },
            submitPaymentRequestMsgType,
            submitRequestQueue,
            { sessionId: uuid() }
          )
        }

        await updateByReference({ reference: request.payload.reference, statusId: request.payload.status, updatedBy: request.payload.user })

        console.log(`Status of claim with reference ${request.payload.reference} successfully updated to ${request.payload.status}`)

        return h.response().code(200)
      }
    }
  }
]
