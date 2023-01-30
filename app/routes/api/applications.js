const Joi = require('joi')
const { get, searchApplications, updateByReference } = require('../../repositories/application-repository')
const statusIds = require('../../constants/application-status')

module.exports = [{
  method: 'GET',
  path: '/api/application/get/{ref}',
  options: {
    validate: {
      params: Joi.object({
        ref: Joi.string().valid()
      })
    },
    handler: async (request, h) => {
      const application = (await get(request.params.ref))
      if (application.dataValues) {
        return h.response(application.dataValues).code(200)
      } else {
        return h.response('Not Found').code(404).takeover()
      }
    }
  }
}, {
  method: 'POST',
  path: '/api/application/search',
  options: {
    validate: {
      payload: Joi.object({
        offset: Joi.number().default(0),
        limit: Joi.number().greater(0).default(20),
        search: Joi.object({
          text: Joi.string().valid().optional().allow(''),
          type: Joi.string().valid().optional().default('sbi')
        }).optional(),
        sort: Joi.object({
          field: Joi.string().valid().optional().default('CREATEDAT'),
          direction: Joi.string().valid().optional().allow('ASC')
        }).optional(),
        filter: Joi.array().optional()
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { applications, total, applicationStatus } = await searchApplications(request.payload.search.text ?? '', request.payload.search.type, request.payload.filter, request.payload.offset, request.payload.limit, request.payload.sort)
      return h.response({ applications, total, applicationStatus }).code(200)
    }
  }
}, {
  method: 'PUT',
  path: '/api/application/{ref}',
  options: {
    validate: {
      params: Joi.object({
        ref: Joi.string().valid()
      }),
      payload: Joi.object({
        status: Joi.string(),
        user: Joi.string()
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const application = (await get(request.params.ref))
      if (!application.dataValues) {
        return h.response('Not Found').code(404).takeover()
      }

      await updateByReference({ reference: request.params.ref, statusId: statusIds.withdrawn, updatedBy: req.payload.user })

      return h.response().code(200)
    }
  }
}]
