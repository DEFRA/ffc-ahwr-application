const util = require('util')
const { get } = require('../repositories/application-repository')
const sendMessage = require('../messaging/send-message')
const { fetchApplicationResponseMsgType, applicationResponseQueue } = require('../config')

const fetchApplication = async (message) => {
  try {
    const msgBody = message.body
    console.log('received application fetch request', util.inspect(msgBody, false, null, true))
    const application = await get(msgBody.applicationReference)

    if (!application) {
      return sendMessage({ applicationState: 'not_exist' }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
    }

    if (application?.vetVisit?.dataValues) {
      return sendMessage({ applicationState: 'already_submitted' }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
    }

    await sendMessage({ applicationState: 'not_submitted' }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
  } catch (error) {
    console.error(`failed to fetch application for request ${JSON.stringify(message.body)}`, error)
    return sendMessage({ applicationState: 'failed' }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId: message.body.sessionId })
  }
}

module.exports = fetchApplication
