const processBackOfficeRequest = require('./process-backoffice')

const processBackOfficeMessage = async (message, receiver) => {
  try {
    await processBackOfficeRequest(message)
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to process Application request:', err)
  }
}

module.exports = processBackOfficeMessage
