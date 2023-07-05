const { applicationRequestMsgType, applicationResponseMsgType, applicationResponseQueue, fetchApplicationRequestMsgType, fetchClaimRequestMsgType, submitClaimRequestMsgType, vetVisitRequestMsgType } = require('../config')
const fetchApplication = require('./application/fetch-application')
const fetchClaim = require('./application/fetch-claim')
const processApplication = require('./application/process-application')
const processVetVisit = require('./application/process-vet-visit')
const submitClaim = require('./application/submit-claim')
const { sendMessage } = require('./index')

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
      case 'uk.gov.ffc.ahwr.deadletter':
        console.log('Dead letter message received: ', message)
        const { sessionId } = message
        await receiver.deadLetterMessage(message) //this is what sends the message to the DLQ
        await sendMessage(
          {
            applicationState: 'dead-letter',
            applicationReference: message.body.applicationReference
          },
          applicationResponseMsgType,
          applicationResponseQueue,
          {
            sessionId
          }
        )
        return
    }
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to process Application request:', err)
  }
}

module.exports = processApplicationMessage
