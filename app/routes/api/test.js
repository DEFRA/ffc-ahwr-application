import HttpStatus from 'http-status-codes'
import { processRedactPiiRequest } from '../../messaging/application/process-redact-pii.js'

export const testRequestHandlers = [
  {
    method: 'POST',
    path: '/api/test1',
    handler: async (request, h) => {
      request.logger.info('Test received')

      const result = await processRedactPiiRequest({
        body: {
          requestedDate: '2025-08-26T00:47:23.200391+00:00'
        }
      }, request.logger)

      return h.response(result).code(HttpStatus.OK)
    }
  }
]
