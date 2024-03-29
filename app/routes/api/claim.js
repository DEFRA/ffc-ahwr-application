const Joi = require('joi')
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
  getByApplicationReference
} = require('../../repositories/claim-repository')
const { compliance } = require('../../config')
const statusIds = require('../../constants/application-status')
const { get } = require('../../repositories/application-repository')
const requiresComplianceCheck = require('../../lib/requires-compliance-check')

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
                  ]
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
            })
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

        const claimStatusIds = [
          statusIds.inCheck,
          statusIds.readyToPay,
          statusIds.rejected,
          statusIds.onHold,
          statusIds.recommendToPay,
          statusIds.recommendToReject
        ]
        const { statusId } = await requiresComplianceCheck(claimStatusIds, compliance.complianceCheckRatio)
        const claim = await set({ ...request.payload, statusId })

        return h.response(claim).code(200)
      }
    }
  }
]
