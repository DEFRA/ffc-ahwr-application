const { applicationRequestMsgType, fetchApplicationRequestMsgType } = require('../config')
const fetchApplication = require('./fetch-application')
const processApplication = require('./process-application')

const processApplicationMessage = async (message, receiver) => {
  try {
    const { applicationProperties: properties } = message
    if (properties.type === fetchApplicationRequestMsgType) {
      await fetchApplication(message)
    }
    if (properties.type === applicationRequestMsgType) {
      await processApplication(message)
    }
    await receiver.completeMessage(message)
  } catch (err) {
    console.log(err)
    console.error('Unable to process Application request:', err)
  }
}

module.exports = processApplicationMessage
