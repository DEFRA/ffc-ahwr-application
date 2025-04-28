import joi from 'joi'
import { deleteFlag, getAllFlags } from '../../repositories/flag-repository.js'
import HttpStatus from 'http-status-codes'
import { raiseApplicationFlagDeletedEvent } from '../../event-publisher/index.js'

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
          user: joi.string().required(),
          deletedNote: joi.string().required()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { user, deletedNote } = request.payload
        const { flagId } = request.params

        request.logger.setBindings({ flagId, user })

        const [rowsChanged, updatedRecords] = await deleteFlag(flagId, user, deletedNote)

        if (rowsChanged === 0) {
          return h.response('Not Found').code(HttpStatus.NOT_FOUND).takeover()
        }

        const { dataValues } = updatedRecords[0]

        await raiseApplicationFlagDeletedEvent({
          application: { id: dataValues.applicationReference },
          message: 'Application flag removed',
          flag: { id: dataValues.id, appliesToMh: dataValues.appliesToMh, deletedNote },
          raisedBy: dataValues.deletedBy,
          raisedOn: dataValues.deletedAt
        }, dataValues.sbi)

        return h.response().code(HttpStatus.NO_CONTENT)
      }
    }
  },
  {
    method: 'get',
    path: '/api/flags',
    options: {
      handler: async (_request, h) => {
        const flags = await getAllFlags()

        return h.response(flags).code(HttpStatus.OK)
      }
    }
  }]
