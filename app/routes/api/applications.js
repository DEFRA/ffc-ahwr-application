const Joi = require('joi')
const { v4: uuidv4 } = require('uuid')
const { get, searchApplications, updateByReference } = require('../../repositories/application-repository')
const submitPaymentRequest = require('../../messaging/payments/submit-payment-request')

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
  method: 'POST',
  path: '/api/application/payment/{ref}',
  options: {
    validate: {
      params: Joi.object({
        ref: Joi.string().valid()
      }),
      payload: Joi.object({
        paid: Joi.string().valid('yes', 'no').required()
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
      if (request.payload.paid === 'yes') {
        await submitPaymentRequest(application.dataValues, uuidv4())
        await updateByReference({ reference: request.params.ref, statusId: 8, updatedBy: 'admin' })
      }

      if (request.payload.paid === 'no') {
        await updateByReference({ reference: request.params.ref, statusId: 7, updatedBy: 'admin' })
      }

      return h.response(application.dataValues).code(200)
    }
  }
}, {
  method: 'POST',
  path: '/api/application/fraud/{ref}',
  options: {
    validate: {
      params: Joi.object({
        ref: Joi.string().valid()
      }),
      payload: Joi.object({
        accepted: Joi.string().valid('yes', 'no').required()
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
      if (request.payload.accepted === 'yes') {
        await updateByReference({ reference: request.params.ref, statusId: 6, updatedBy: 'admin' })
      }

      if (request.payload.accepted === 'no') {
        await updateByReference({ reference: request.params.ref, statusId: 7, updatedBy: 'admin' })
      }

      return h.response(application.dataValues).code(200)
    }
  }
}]
