const { applicationRequestMsgType, fetchApplicationRequestMsgType, fetchClaimRequestMsgType, submitClaimRequestMsgType, vetVisitRequestMsgType } = require('../config')
const fetchApplication = require('./application/fetch-application')
const fetchClaim = require('./application/fetch-claim')
const processApplication = require('./application/process-application')
const processVetVisit = require('./application/process-vet-visit')
const submitClaim = require('./application/submit-claim')

const processApplicationMessage = async (message, receiver) => {
  try {
    const { applicationProperties: properties } = message
    switch (properties.type) {
      case applicationRequestMsgType:
        await processApplication(message)
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
      case vetVisitRequestMsgType:
        await processVetVisit(message)
        break
    }
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to process Application request:', err)
  }
}

module.exports = processApplicationMessage
