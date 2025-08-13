import joi from 'joi'
import { getApplicationEvents } from '../../azure-storage/application-eventstore-repository.js'
import { StatusCodes } from 'http-status-codes'

export const applicationEventsHandlers = [
  {
    method: 'GET',
    path: '/api/application/events/{ref}',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const eventRecords = await getApplicationEvents(request.params.ref)
        return h.response({ eventRecords }).code(StatusCodes.OK)
      }
    }
  }
]
