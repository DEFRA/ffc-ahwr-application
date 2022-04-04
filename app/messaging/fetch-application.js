const util = require('util')
const { get } = require('../repositories/application-repository')
const sendMessage = require('../messaging/send-message')
const { fetchApplicationResponseMsgType, fetchApplicationResponseQueue } = require('../config')

const fetchApplication = async (message, receiver) => {
  try {
    const msgBody = message.body
    console.log(msgBody)
    console.log('received application fetch request', util.inspect(msgBody, false, null, true))
    const application = await get(msgBody.application)
    await sendMessage(application, fetchApplicationResponseMsgType, fetchApplicationResponseQueue, { sessionId: msgBody.sessionId })
    await receiver.completeMessage(message)
  } catch (error) {
    console.log(error)
    console.error(`failed to fetch application for request ${JSON.stringify(message.body)}`, error)
  }
}

module.exports = fetchApplication