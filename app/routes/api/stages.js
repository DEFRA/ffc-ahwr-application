const Joi = require('joi')
const { getStageConfiguration, getStageExecution, addStageExecution, updateStageExecutionById } = require('../../repositories/application-repository')

module.exports = [{
  method: 'GET',
  path: '/api/stageconfiguration',
  options: {
    handler: async (request, h) => {
      const stageConfiguration = (await getStageConfiguration())
      if (stageConfiguration) {
        return h.response(stageConfiguration).code(200)
      } else {
        return h.response('Not Found').code(404).takeover()
      }
    }
  }
}, {
  method: 'GET',
  path: '/api/stageexecution',
  options: {
    handler: async (request, h) => {
      const stageExecution = (await getStageExecution())
      if (stageExecution) {
        return h.response(stageExecution).code(200)
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
        applicationReference: Joi.string(),
        stageConfigurationId: Joi.number(),
        user: Joi.string(),
        action: Joi.object()
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const row = await addStageExecution(request.payload)
      return h.response(row).code(200)
    }
  }
}, {
  method: 'PUT',
  path: '/api/stageexecution/{id}',
  options: {
    validate: {
      params: Joi.object({
        id: Joi.number().valid()
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      await updateStageExecutionById({ id: request.params.id })

      return h.response().code(200)
    }
  }
}]
