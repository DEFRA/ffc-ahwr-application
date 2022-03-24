const util = require('util')
const { set } = require('../repositories/application-repository')
const { applicationResponseMsgType, applicationResponseQueue } = require('../config')
const sendMessage = require('../messaging/send-message')
const createReference = require('../lib/create-reference')
const { notify: { templateIdApplicationComplete } } = require('../config')
const sendEmail = require('../lib/send-email')
const boom = require('@hapi/boom')
const processApplication = async (msg) => {
  const reference = createReference()
  await set({
    reference,
    type: 'VV001',
    data: JSON.stringify(msg.body),
    createdBy: 'admin',
    updatedBy: 'admin',
    updatedAt: new Date(),
    createdAt: new Date()
  })
  const msgBody = msg.body
  msgBody.applicationId = reference
  sendMessage(msgBody, applicationResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
  const result = await sendEmail(templateIdApplicationComplete, msgBody.organisation.email, { personalisation: { name: msgBody.organisation.name, reference }, reference })

  if (!result) {
    return boom.internal()
  }
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
