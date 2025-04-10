import joi from 'joi'
import { getFlagByFlagId, deleteFlag, getAllFlags } from '../../repositories/flag-repository.js'

export const flagHandlers = [
  {
    method: 'patch',
    path: '/api/application/flag/{flagId}/delete',
    options: {
      validate: {
        params: joi.object({
          flagId: joi.string().valid()
        }),
        payload: joi.object({
          user: joi.string().required()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })
          return h.response({ err }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const { user } = request.payload
        const { flagId } = request.params

        request.logger.setBindings({ flagId, user })

        const flag = await getFlagByFlagId(flagId)

        if (flag === null) {
          return h.response('Not Found').code(404).takeover()
        }

        await deleteFlag(flagId, user)

        return h.response().code(204)
      }
    }
  },
  {
    method: 'get',
    path: '/api/flags',
    options: {
      handler: async (request, h) => {
        const flags = await getAllFlags()

        return h.response(flags).code(200)
      }
    }
  }]
