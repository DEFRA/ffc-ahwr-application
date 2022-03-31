const util = require('util')
const { set, update } = require('../repositories/application-repository')
const { applicationResponseMsgType, applicationResponseQueue } = require('../config')
const sendMessage = require('../messaging/send-message')
const createReference = require('../lib/create-reference')
const { notify: { templateIdApplicationComplete } } = require('../config')
const sendEmail = require('../lib/send-email')
const processApplication = async (msg) => {
  const responseMessage = msg.body
  let reference = ''
  try {
    // Get ID
    const result = await set({
      reference,
      data: JSON.stringify(msg.body),
      createdBy: 'admin',
      createdAt: new Date()
    })
    // GetReference for ID
    const application = result.dataValues
    reference = msg.body.applicationId = createReference(application.id)
    // Update
    await update({
      ...application,
      reference,
      data: JSON.stringify(msg.body),
      updatedBy: 'admin',
      updatedAt: new Date()
    })
    await sendMessage(msg.body, applicationResponseMsgType, applicationResponseQueue, { sessionId: msg.body.sessionId })
  } catch {
    responseMessage.error = {
      message: 'can\'t submit application at this time.'
    }
  } finally {
    const result = await sendEmail(templateIdApplicationComplete, msg.body.organisation.email, { personalisation: { name: msg.body.organisation.name, reference }, reference })

    if (!result) {
      responseMessage.error = {
        message: 'can\'t send message.'
      }
    }
  }
  return responseMessage
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
