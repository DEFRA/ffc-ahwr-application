import { config } from '../../config/index.js'
import { sendMessage } from '../../messaging/send-message.js'

const { redactPiiRequestMsgType, applicationRequestQueue } = config

export const redactPiiRequestHandlers = [
  {
    method: 'POST',
    path: '/api/redact/pii',
    handler: async (request, h) => {
      request.logger.info('Request for redact PII received')
      sendMessage({ requestDate: new Date() }, redactPiiRequestMsgType, applicationRequestQueue)
      return h.response().code(202)
    }
  }
]
