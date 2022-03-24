const util = require('util')
const { set } = require('../repositories/application-repository')
const { applicationResponseMsgType, applicationResponseQueue } = require('../config')
const { sendMessage } = require('../messaging')

const processApplication = async (msg) => {
  await set({
    reference: msg.body.applicationId,
    grantType: 'SGS001',
    data: JSON.stringify(msg.body),
    createdBy: 'admin',
    updatedBy: 'admin',
    updatedAt: new Date(),
    createdAt: new Date()
  })
  const msgBody = msg.body
  msgBody.applicationId = '123456789'
  sendMessage(msgBody, applicationResponseMsgType, applicationResponseQueue, { sessionId: msg.body.sessionId })
}

const processApplicationMessage = async (message, receiver) => {
  try {
    const { body: msgBody } = message
    console.log('Application received:', util.inspect(msgBody, false, null, true))
    await processApplication(message)
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to process Application request:', err)
  }
}

module.exports = processApplicationMessage
