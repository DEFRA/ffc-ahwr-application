import { config } from '../config/index.js'
import { processApplicationQueue } from './application/process-application.js'
import { setPaymentStatusToPaid } from './application/set-payment-status-to-paid.js'
import { processRedactPiiRequest } from './application/process-redact-pii.js'

const { applicationRequestMsgType, moveClaimToPaidMsgType, redactPiiRequestMsgType } = config

export const processApplicationMessage = async (message, receiver, logger) => {
  try {
    const { applicationProperties: properties } = message

    switch (properties.type) {
      case applicationRequestMsgType:
        await processApplicationQueue(message, logger)
        break
      case moveClaimToPaidMsgType:
        await setPaymentStatusToPaid(message, logger)
        break
      case redactPiiRequestMsgType:
        processRedactPiiRequest(message, logger)
        break
    }

    await receiver.completeMessage(message)
  } catch (err) {
    logger.error('Unable to process Application request:', err)
  }
}
