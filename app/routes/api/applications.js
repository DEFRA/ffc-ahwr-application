const Joi = require('joi')
const { get, searchApplications } = require('../../repositories/application-repository')
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
      console.log(request.params.ref, 'ref')
      const application = (await get(request.params.ref))
      console.log(application)
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
        }).optional()
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { applications, total } = await searchApplications(request.payload.search.text ?? '', request.payload.search.type, request.payload.offset, request.payload.limit)
      return h.response({ applications, total }).code(200)
    }
  }
}]
