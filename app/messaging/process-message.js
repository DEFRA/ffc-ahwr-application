const { applicationRequestMsgType, fetchApplicationRequestMsgType, fetchClaimRequestMsgType, submitClaimRequestMsgType, vetVisitRequestMsgType } = require('../config')
const fetchApplication = require('./fetch-application')
const fetchClaim = require('./fetch-claim')
const processApplication = require('./process-application')
const processVetVisit = require('./process-vet-visit')
const submitClaim = require('./submit-claim')

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
