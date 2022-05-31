const { backOfficeRequestMsgType } = require('../config')

const processBackOfficeRequest = require('./process-backoffice')

const processBackOfficeMessage = async (message, receiver) => {
  try {
    console.log('received message', message)
    const { requestProperties: properties } = message
    if (properties.type === backOfficeRequestMsgType) {
      await processBackOfficeRequest(message)
    }
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to process Application request:', err)
  }
}

module.exports = processBackOfficeMessage
