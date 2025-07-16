import { config } from '../../config/index.js'
import { sendMessage } from '../../messaging/send-message.js'

const { piiRedactRequestMsgType, applicationRequestQueue } = config

export const piiRedactRequestHandlers = [
  {
    method: 'POST',
    path: '/api/redact/pii',
    handler: async (request, h) => {
      request.logger.info('Request for PII redact received')
      sendMessage({ requestDate: new Date() }, piiRedactRequestMsgType, applicationRequestQueue)
      return h.response().code(202)
    }
  }
]
