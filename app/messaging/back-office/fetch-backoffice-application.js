const util = require('util')
const { get } = require('../../repositories/application-repository')
const sendMessage = require('../send-message')
const { getBackOfficeApplicationResponseMsgType, backOfficeResponseQueue } = require('../../config')
const states = require('../states')

const fetchBackOfficeApplication = async (message) => {
  const { sessionId } = message
  try {
    const msgBody = message.body
    console.log('received application fetch request', util.inspect(msgBody, false, null, true))
    const application = (await get(msgBody.reference)).dataValues

    if (!application) {
      return sendMessage({ applicationState: states.notFound, ...application }, getBackOfficeApplicationResponseMsgType, backOfficeResponseQueue, { sessionId })
    }

    await sendMessage({ applicationState: states.notSubmitted, ...application }, getBackOfficeApplicationResponseMsgType, backOfficeResponseQueue, { sessionId })
  } catch (error) {
    console.error(`failed to fetch application for request ${JSON.stringify(message.body)}`, error)
    return sendMessage({ applicationState: states.failed }, getBackOfficeApplicationResponseMsgType, backOfficeResponseQueue, { sessionId })
  }
}

module.exports = fetchBackOfficeApplication
