const Joi = require('joi')
const { v4: uuid } = require('uuid')
const sendMessage = require('../../messaging/send-message')
const { submitPaymentRequestMsgType, submitRequestQueue } = require('../../config')
const appInsights = require('applicationinsights')
const {
  speciesNumbers: { yes, no },
  biosecurity,
  minimumNumberOfAnimalsTested,
  claimType: { review, endemics },
  minimumNumberOfOralFluidSamples,
  testResults: { positive, negative },
  livestockTypes: { beef, dairy, pigs, sheep }
} = require('../../constants/claim')
const {
  set,
  getByReference,
  updateByReference,
  getByApplicationReference
} = require('../../repositories/claim-repository')
const statusIds = require('../../constants/application-status')
const { get } = require('../../repositories/application-repository')
const { sendFarmerEndemicsClaimConfirmationEmail } = require('../../lib/send-email')
// const requiresComplianceCheck = require('../../lib/requires-compliance-check')

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
        const claimDataModel = Joi.object({
          applicationReference: Joi.string().required(),
          data: Joi.object({
            typeOfLivestock: Joi.string()
              .valid(beef, dairy, pigs, sheep)
              .required(),
            dateOfVisit: Joi.date().required(),
            dateOfTesting: Joi.date().required(),
            vetsName: Joi.string().required(),
            vetRCVSNumber: Joi.string().required(),
            ...(request.payload.data.typeOfLivestock === sheep && request.payload.type === endemics ? {} : { laboratoryURN: Joi.string().required() }),
            speciesNumbers: Joi.string().valid(yes, no).required(),
            ...(request.payload.data.typeOfLivestock === pigs && request.payload.type === review && {
              numberOfOralFluidSamples: Joi.number()
                .min(minimumNumberOfOralFluidSamples)
                .required()
            }),
            ...(request.payload.data.typeOfLivestock === pigs && request.payload.type === endemics && {
              numberOfSamplesTested: Joi.number()
                .valid(6, 30)
                .required()
            }),
            ...([beef, sheep, pigs].includes(
              request.payload.data.typeOfLivestock
            ) && {
              numberAnimalsTested: Joi.number()
                .min(
                  minimumNumberOfAnimalsTested[
                    request.payload.data.typeOfLivestock
                  ][request.payload.type]
                )
                .required()
            }),
            ...(request.payload.data.typeOfLivestock === pigs && request.payload.type === endemics && {
              herdVaccinationStatus: Joi.string().valid('vaccinated', 'notVaccinated').required(),
              diseaseStatus: Joi.string().valid('1', '2', '3', '4').required(),
              biosecurity: Joi.alternatives().try(
                Joi.string().valid(biosecurity.no),
                Joi.object({ biosecurity: Joi.string().valid(biosecurity.yes), assessmentPercentage: Joi.string().pattern(/^(?!0$)(100|\d{1,2})$/) })
              ).required()
            }),
            ...(request.payload.data.typeOfLivestock === pigs && request.payload.type === review && {
              testResults: Joi.string().valid(positive, negative).required()
            }),
            ...(request.payload.data.typeOfLivestock === sheep && request.payload.type === endemics && {
              sheepEndemicsPackage: Joi.string().required(),
              testResults: Joi.array().items(
                Joi.object({
                  diseaseType: Joi.string(),
                  result: Joi.alternatives().try(
                    Joi.string(),
                    Joi.array().items(Joi.object({ diseaseType: Joi.string(), result: Joi.string() }))
                  )
                })).required()
            }),
            ...([beef, dairy].includes(
              request.payload.data.typeOfLivestock
            ) && {
              testResults: Joi.string().valid(positive, negative).required()
            }),
            ...([beef, dairy].includes(
              request.payload.data.typeOfLivestock
            ) && request.payload.type === endemics && {
              biosecurity: Joi.string().valid(biosecurity.yes, biosecurity.no).required()
            }),
            ...([beef, dairy, pigs].includes(
              request.payload.data.typeOfLivestock
            ) && {
              vetVisitsReviewTestResults: Joi.string().valid(positive, negative).optional()
            }),
            amount: Joi.string().optional()
          }),
          type: Joi.string().valid(review, endemics).required(),
          createdBy: Joi.string().required()
        })

        const { error } = claimDataModel.validate(request.payload)

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

        const { reference, data: { amount } } = claim
        const { organisation: { email, farmerName, name, orgEmail } } = application.dataValues.data
        const orgData = { orgName: name, orgEmail }

        claim && await sendFarmerEndemicsClaimConfirmationEmail({
          reference,
          amount,
          email,
          farmerName,
          orgData
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
              whichReview: claim.dataValues.data.typeOfLivestock
            }, submitPaymentRequestMsgType, submitRequestQueue, { sessionId: uuid() }
          )
        }

        await updateByReference({ reference: request.payload.reference, statusId: request.payload.status, updatedBy: request.payload.user })

        console.log(`Status of claim with reference ${request.payload.reference} successfully updated to ${request.payload.status}`)

        return h.response().code(200)
      }
    }
  }
]
