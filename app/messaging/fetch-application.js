const util = require('util')
const { get } = require('../repositories/application-repository')
const sendMessage = require('../messaging/send-message')
const { fetchApplicationResponseMsgType, applicationResponseQueue } = require('../config')
const states = require('./states')

const fetchApplication = async (message) => {
  let application
  try {
    const msgBody = message.body
    console.log('received application fetch request', util.inspect(msgBody, false, null, true))
    application = (await get(msgBody.applicationReference)).dataValues

    if (!application) {
      return sendMessage({ applicationState: states.notExist, ...application }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
    }

    if (application?.vetVisit?.dataValues) {
      return sendMessage({ applicationState: states.alreadySubmitted, ...application }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
    }

    await sendMessage({ applicationState: states.notSubmitted, ...application }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
  } catch (error) {
    console.error(`failed to fetch application for request ${JSON.stringify(message.body)}`, error)
    return sendMessage({ applicationState: states.failed }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId: message.body.sessionId })
  }
}

module.exports = fetchApplication
