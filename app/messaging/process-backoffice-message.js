const { getBackOfficeApplicationRequestMsgType, backOfficeRequestMsgType } = require('../config')
const processBackOfficeRequest = require('./process-backoffice')
const fetchBackOfficeApplication = require('./fetch-backoffice-application')

const processBackOfficeMessage = async (message, receiver) => {
  try {
    const { applicationProperties: properties } = message
    switch (properties.type) {
      case backOfficeRequestMsgType:
        await processBackOfficeRequest(message)
        break
      case getBackOfficeApplicationRequestMsgType:
        await fetchBackOfficeApplication(message)
        break
    }
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to process Application request:', err)
  }
}

module.exports = processBackOfficeMessage
