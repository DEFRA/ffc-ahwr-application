const Joi = require('joi')
const { getAll, set, getById, update, getByApplicationReference } = require('../../repositories/stage-execution-repository')

module.exports = [{
  method: 'GET',
  path: '/api/stageexecution',
  options: {
    handler: async (request, h) => {
      const stageExecution = await getAll()
      if (stageExecution) {
        return h.response(stageExecution).code(200)
      } else {
        return h.response('Not Found').code(404).takeover()
      }
    }
  }
}, {
  method: 'GET',
  path: '/api/stageexecution/{applicationReference}',
  options: {
    validate: {
      params: Joi.object({
        applicationReference: Joi.string().required()
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const stageExecutions = await getByApplicationReference(request.params.applicationReference)
      if (stageExecutions) {
        return h.response(stageExecutions).code(200)
      } else {
        return h.response('Not Found').code(404).takeover()
      }
    }
  }
}, {
  method: 'POST',
  path: '/api/stageexecution',
  options: {
    validate: {
      payload: Joi.object({
        applicationReference: Joi.string().required(),
        stageConfigurationId: Joi.number().greater(0).required(),
        executedAt: Joi.date().default(new Date()),
        executedBy: Joi.string().required(),
        processedAt: Joi.date().allow(null).optional(),
        action: Joi.object({
          action: Joi.string().required()
        }).allow(null).optional()
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const response = await set(request.payload)
      console.log('Stage execution inserted: ', response.dataValues)
      return h.response(response).code(200)
    }
  }
}, {
  method: 'PUT',
  path: '/api/stageexecution/{id}',
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
      const stageExecution = await getById(request.params.id)
      if (!stageExecution) {
        return h.response('Not Found').code(404).takeover()
      }

      const response = await update(request.params)

      return h.response(response).code(200)
    }
  }
}]
