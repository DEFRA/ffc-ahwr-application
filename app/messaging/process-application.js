const util = require('util')
const { set } = require('../repositories/application-repository')
const { applicationResponseMsgType, applicationResponseQueue } = require('../config')
const sendMessage = require('../messaging/send-message')
const sendEmail = require('../lib/send-email')

const processApplication = async (msg) => {
  const responseMessage = msg.body
  let reference = ''
  try {
    console.log('Application received:', util.inspect(msg.body, false, null, true))
    // Get ID
    const result = await set({
      reference,
      data: msg.body,
      createdBy: 'admin',
      createdAt: new Date()
    })
    // GetReference for ID
    const application = result.dataValues
    reference = msg.body.applicationReference = application.reference
    await sendMessage(msg.body, applicationResponseMsgType, applicationResponseQueue, { sessionId: msg.body.sessionId })
  } catch (err) {
    console.error(err)
    responseMessage.error = {
      message: 'can\'t submit application at this time.'
    }
  } finally {
    const result = await sendEmail.sendFarmerConfirmationEmail(msg.body.organisation.email, msg.body.organisation.name, reference)

    if (!result) {
      responseMessage.error = {
        message: 'can\'t send message.'
      }
    }
  }
  return responseMessage
}

module.exports = processApplication
