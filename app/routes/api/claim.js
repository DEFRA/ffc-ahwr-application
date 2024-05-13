const Joi = require('joi')
const { v4: uuid } = require('uuid')
const sendMessage = require('../../messaging/send-message')
const { submitPaymentRequestMsgType, submitRequestQueue } = require('../../config')
const appInsights = require('applicationinsights')
const { speciesNumbers: { yes, no }, biosecurity, minimumNumberOfAnimalsTested, claimType: { review, endemics }, minimumNumberOfOralFluidSamples, testResults: { positive, negative }, livestockTypes: { beef, dairy, pigs, sheep } } = require('../../constants/claim')
const { set, getByReference, updateByReference, getByApplicationReference } = require('../../repositories/claim-repository')
const statusIds = require('../../constants/application-status')
const { get } = require('../../repositories/application-repository')
const { sendFarmerEndemicsClaimConfirmationEmail } = require('../../lib/send-email')
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

const isClaimDataValid = (payload) => {
  const pigsTestResults = isPigsReview(payload) && Joi.string().valid(positive, negative).required()
  const sheepTestResults = isSheepEndemics(payload) && Joi.array().items(Joi.object({ diseaseType: Joi.string(), result: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.object({ diseaseType: Joi.string(), result: Joi.string() }))) })).required()
  const beefDairyTestResults = [beef, dairy].includes(payload.data.typeOfLivestock) && Joi.string().valid(positive, negative).required()
  const beefDairyBiosecurity = [beef, dairy].includes(payload.data.typeOfLivestock) && isEndemicsFollowUp(payload) && Joi.string().valid(biosecurity.yes, biosecurity.no).required()
  const pigsBiosecurity = isPigsEndemics(payload) && Joi.alternatives().try(Joi.string().valid(biosecurity.no), Joi.object({ biosecurity: Joi.string().valid(biosecurity.yes), assessmentPercentage: Joi.string().pattern(/^(?!0$)(100|\d{1,2})$/) })).required()

  const claimDataModel = Joi.object({
    applicationReference: Joi.string().required(),
    type: Joi.string().valid(review, endemics).required(),
    createdBy: Joi.string().required(),
    data: Joi.object({
      typeOfLivestock: Joi.string().valid(beef, dairy, pigs, sheep).required(),
      dateOfVisit: Joi.date().required(),
      dateOfTesting: !isNegativeBeefReviewTestResult(payload) && Joi.date().required(),
      vetsName: Joi.string().required(),
      vetRCVSNumber: Joi.string().required(),
      laboratoryURN: !isNegativeBeefReviewTestResult(payload) && !isSheepEndemics(payload) && Joi.string().required(),
      speciesNumbers: Joi.string().valid(yes, no).required(),
      numberOfOralFluidSamples: isPigsReview(payload) && Joi.number().min(minimumNumberOfOralFluidSamples).required(),
      numberOfSamplesTested: isPigsEndemics(payload) && Joi.number().valid(6, 30).required(),
      numberAnimalsTested: !isNegativeBeefReviewTestResult(payload) && [beef, sheep, pigs].includes(payload.data.typeOfLivestock) && Joi.number().min(minimumNumberOfAnimalsTested[payload.data.typeOfLivestock][payload.type]).required(),
      herdVaccinationStatus: isPigsEndemics(payload) && Joi.string().valid('vaccinated', 'notVaccinated').required(),
      diseaseStatus: isPigsEndemics(payload) && Joi.string().valid('1', '2', '3', '4').required(),
      piHunt: isPositiveBeefReviewTestResult(payload) && Joi.string().valid(yes, no).required(),
      biosecurity: pigsBiosecurity || beefDairyBiosecurity,
      reviewTestResults: [beef, dairy, pigs].includes(payload.data.typeOfLivestock) && isEndemicsFollowUp(payload) && Joi.string().valid(positive, negative).required(),
      testResults: !isNegativeBeefReviewTestResult(payload) && (pigsTestResults || sheepTestResults || beefDairyTestResults),
      sheepEndemicsPackage: isSheepEndemics(payload) && Joi.string().required(),
      vetVisitsReviewTestResults: [beef, dairy, pigs].includes(payload.data.typeOfLivestock) && Joi.string().valid(positive, negative).optional(),
      amount: Joi.string().optional()
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
    path: '/api/claim',
    options: {
      handler: async (request, h) => {
        const { error } = isClaimDataValid(request.payload)

        if (error) {
          appInsights.defaultClient.trackException({ exception: error })
          return h.response({ error }).code(400).takeover()
        }

        const application = await get(request.payload.applicationReference)

        if (!application?.dataValues) {
          return h.response('Not Found').code(404).takeover()
        }

        // const { statusId } = await requiresComplianceCheck('claim')
        // TODO: Currently claim status by default is in check but in future, We should use requiresComplianceCheck('claim')
        // TODO: This file has been excluded from sonarcloud as it is a temporary solution, We should remove this exclusion in future
        const claim = await set({ ...request.payload, statusId: statusIds.inCheck })

        claim && await sendFarmerEndemicsClaimConfirmationEmail({
          reference: claim?.dataValues?.reference,
          amount: '£[amount]',
          email: application?.dataValues?.data?.email,
          farmerName: application?.dataValues?.data?.farmerName,
          orgData: {
            orgName: application?.dataValues?.data?.organisation?.name,
            orgEmail: application?.dataValues?.data?.organisation?.orgEmail
          }
        })

        return h.response(claim).code(200)
      }
    }
  }, {
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
