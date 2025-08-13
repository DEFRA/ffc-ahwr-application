import Joi from 'joi'
import { getAll, getById } from '../../repositories/stage-configuration-repository.js'
import { StatusCodes } from 'http-status-codes'

export const stageConfiguationHandlers = [{
  method: 'GET',
  path: '/api/stageconfiguration',
  options: {
    handler: async (request, h) => {
      const stageConfiguration = await getAll()
      if (stageConfiguration) {
        return h.response(stageConfiguration).code(StatusCodes.OK)
      } else {
        return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
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
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        return h.response({ err }).code(StatusCodes.BAD_REQUEST).takeover()
      }
    },
    handler: async (request, h) => {
      const stageConfiguration = await getById(request.params.id)
      if (stageConfiguration) {
        return h.response(stageConfiguration).code(StatusCodes.OK)
      }
      return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
    }
  }
}]
