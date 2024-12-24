const { applicationRequestMsgType, fetchApplicationRequestMsgType, fetchClaimRequestMsgType, submitClaimRequestMsgType } = require('../config')
const fetchApplication = require('./application/fetch-application').default
const fetchClaim = require('./application/fetch-claim').default
const { processApplicationQueue } = require('./application/process-application')
const submitClaim = require('./application/submit-claim')

const processApplicationMessage = async (message, receiver) => {
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

module.exports = processApplicationMessage
