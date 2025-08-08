import HttpStatus from 'http-status-codes'
import { config } from '../../config/index.js'
import { sendMessage } from '../../messaging/send-message.js'

const { redactPiiRequestMsgType, applicationRequestQueue } = config

export const redactPiiRequestHandlers = [
  {
    method: 'POST',
    path: '/api/redact/pii',
    handler: async (request, h) => {
      request.logger.info('Request for redact PII received')

      const now = new Date()
      const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      sendMessage({ requestedDate: utcMidnight }, redactPiiRequestMsgType, applicationRequestQueue)

      return h.response().code(HttpStatus.ACCEPTED)
    }
  }
]
