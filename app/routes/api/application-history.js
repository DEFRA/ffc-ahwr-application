import Joi from 'joi'
import { getApplicationHistory } from '../../azure-storage/application-status-repository.js'

export const applicationHistoryHandlers = [
  {
    method: 'GET',
    path: '/api/application/history/{ref}',
    options: {
      validate: {
        params: Joi.object({
          ref: Joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const historyRecords = await getApplicationHistory(request.params.ref)
        historyRecords.sort((a, b) => new Date(a.ChangedOn) - new Date(b.ChangedOn))
        return h.response({ historyRecords }).code(200)
      }
    }
  }
]
