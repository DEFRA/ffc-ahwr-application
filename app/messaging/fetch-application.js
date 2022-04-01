const { get } = require('../repositories/application-repository')
const sendMessage = require('../messaging/send-message')
const { fetchApplicationResponseMsgType, fetchApplicationResponseQueue } = require('../config')

module.exports.fetchApplication = async (message, receiver) => {
  try {
    const { body: msgBody } = message
    console.log('received application fetch request', util.inspect(msgBody, false, null, true))
    const application = get(message.body.application)
    await sendMessage(application, fetchApplicationResponseMsgType, fetchApplicationResponseQueue, { message: msgBody.body.sessionId })
    await receiver.completeMessage(message)
  } catch (error) {
    console.error(`failed to fetch application for request ${JSON.stringify(msgBody)}`, error)
  }
}