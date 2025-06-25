import { config } from '../config/index.js'
import { processApplicationQueue } from './application/process-application.js'
import { setPaymentStatusToPaid } from './application/set-payment-status-to-paid.js'

const { applicationRequestMsgType, moveClaimToPaidMsgType } = config

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
    }

    await receiver.completeMessage(message)
  } catch (err) {
    logger.error('Unable to process Application request:', err)
  }
}
