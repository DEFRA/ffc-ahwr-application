const Joi = require('joi')
const { getAll, getById } = require('../../repositories/stage-configuration-repository')

module.exports = [{
  method: 'GET',
  path: '/api/stageconfiguration',
  options: {
    handler: async (request, h) => {
      try {
        const stageConfiguration = await getAll()
        if (stageConfiguration) {
          return h.response(stageConfiguration).code(200)
        } else {
          return h.response('Not Found').code(404).takeover()
        }
      } catch (err) {
        return h.response({ err }).code(400).takeover()
      }
    }
  }
}, {
  method: 'GET',
  path: '/api/stageconfiguration/{id}',
  options: {
    validate: {
      params: Joi.object({
        id: Joi.number().greater(0).required()
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      try {
        const stageConfiguration = await getById(request.params.id)
        if (stageConfiguration) {
          return h.response(stageConfiguration).code(200)
        } else {
          return h.response('Not Found').code(404).takeover()
        }
      } catch (err) {
        return h.response({ err }).code(400).takeover()
      }
    }
  }
}]
