const util = require('util')
const { get } = require('../repositories/application-repository')
const sendMessage = require('../messaging/send-message')
const { fetchApplicationResponseMsgType, applicationResponseQueue } = require('../config')

const fetchApplication = async (message) => {
  try {
    const msgBody = message.body
    console.log('received application fetch request', util.inspect(msgBody, false, null, true))
    const application = await get(msgBody.application)
    await sendMessage(application, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
  } catch (error) {
    console.log(error)
    console.error(`failed to fetch application for request ${JSON.stringify(message.body)}`, error)
  }
}

module.exports = fetchApplication