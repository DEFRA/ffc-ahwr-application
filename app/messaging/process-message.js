const { applicationRequestMsgType, fetchApplicationRequestMsgType, vetVisitRequestMsgType } = require('../config')
const fetchApplication = require('./fetch-application')
const processApplication = require('./process-application')
const processVetVisit = require('./process-vet-visit')

const processApplicationMessage = async (message, receiver) => {
  try {
    const { applicationProperties: properties } = message
    switch (properties.type) {
      case fetchApplicationRequestMsgType:
        await fetchApplication(message)
        break
      case applicationRequestMsgType:
        await processApplication(message)
        break
      case vetVisitRequestMsgType:
        await processVetVisit(message)
        break
    }
    await receiver.completeMessage(message)
  } catch (err) {
    console.log(err)
    console.error('Unable to process Application request:', err)
  }
}

module.exports = processApplicationMessage
