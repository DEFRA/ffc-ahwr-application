import { config } from '../config'
import { fetchApplication } from './application/fetch-application'
import { fetchClaim } from './application/fetch-claim'
import { processApplicationQueue } from './application/process-application'
import { submitClaim } from './application/submit-claim'

const { applicationRequestMsgType, fetchApplicationRequestMsgType, fetchClaimRequestMsgType, submitClaimRequestMsgType } = config

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
      case submitClaimRequestMsgType:
        await submitClaim(message)
        break
    }
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to process Application request:', err)
  }
}
