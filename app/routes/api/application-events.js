import { object, string } from 'joi'
import { getApplicationEvents } from '../../azure-storage/application-eventstore-repository'

export const applicationEventsHandlers = [
  {
    method: 'GET',
    path: '/api/application/events/{ref}',
    options: {
      validate: {
        params: object({
          ref: string().valid()
        })
      },
      handler: async (request, h) => {
        const eventRecords = await getApplicationEvents(request.params.ref)
        return h.response({ eventRecords }).code(200)
      }
    }
  }
]
