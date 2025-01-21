import { config } from '../config/index.js'
import { fetchApplication } from './application/fetch-application.js'
import { fetchClaim } from './application/fetch-claim.js'
import { processApplicationQueue } from './application/process-application.js'

const { applicationRequestMsgType, fetchApplicationRequestMsgType, fetchClaimRequestMsgType } = config

export const processApplicationMessage = async (message, receiver) => {
  try {
    const { applicationProperties: properties } = message
    switch (properties.type) {
      case applicationRequestMsgType:
        await processApplicationQueue(message)
        break
      case fetchApplicationRequestMsgType:
        await fetchApplication(message)
        break
      case fetchClaimRequestMsgType:
        await fetchClaim(message)
        break
    }
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to process Application request:', err)
  }
}
