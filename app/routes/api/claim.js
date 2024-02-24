const Joi = require('joi')
const {
  speciesNumbers: { yes, no },
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
            laboratoryURN: Joi.string().required(),
            speciesNumbers: Joi.string().valid(yes, no).required(),
            ...(request.payload.data.typeOfLivestock === pigs && {
              numberOfOralFluidSamples: Joi.number()
                .min(minimumNumberOfOralFluidSamples)
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
            ...([beef, dairy, pigs].includes(
              request.payload.data.typeOfLivestock
            ) && {
              testResults: Joi.string().valid(positive, negative).required()
            })
          }),
          type: Joi.string().valid(review, endemics).required(),
          createdBy: Joi.string().required()
        })

        const { error } = claimDataModel.validate(request.payload)

        if (error) {
          return h.response({ error }).code(400).takeover()
        }

        const application = await get(request.payload.applicationReference)

        if (!application.dataValues) {
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
