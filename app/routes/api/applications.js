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
      const application = (await get(request.params.ref)).dataValues
      return h.response(application).code(200)
    }
  }
}, {
  method: 'POST',
  path: '/api/application/search',
  handler: async (request, h) => {
    const { applications, total } = await searchApplications(request.payload.search.text, request.payload.search.type ?? 'sbi', request.payload.offset, request.payload.limit)

    return h.response({ applications, total }).code(200)
  }
}]
