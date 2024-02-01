const Joi = require('joi')
const {
  set,
  getByReference,
  getByApplicationReference
} = require('../../repositories/claim-repository')
const { get } = require('../../repositories/application-repository')

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
      validate: {
        payload: Joi.object({
          reference: Joi.string().required(),
          applicationReference: Joi.string().required(),
          data: Joi.object().required(),
          statusId: Joi.number().required(),
          type: Joi.string().required(),
          createdBy: Joi.string().required()
        }),
        failAction: async (_request, h, err) => {
          return h.response({ err }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const application = await get(request.payload.applicationReference)

        if (!application.dataValues) {
          return h.response('Not Found').code(404).takeover()
        }

        const claim = await set(request.payload)

        return h.response(claim).code(200)
      }
    }
  }
]
