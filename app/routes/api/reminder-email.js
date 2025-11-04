import HttpStatus from 'http-status-codes'
import { config } from '../../config/index.js'
import { sendMessage } from '../../messaging/send-message.js'

const { reminderEmailRequestMsgType, applicationRequestQueue } = config

export const reminderEmailRequestHandlers = [
  {
    method: 'POST',
    path: '/api/email/reminder',
    handler: async (request, h) => {
      request.logger.info('Request for reminder email received')

      const now = new Date()
      const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      sendMessage({ requestedDate: utcMidnight }, reminderEmailRequestMsgType, applicationRequestQueue)

      return h.response().code(HttpStatus.ACCEPTED)
    }
  }
]
