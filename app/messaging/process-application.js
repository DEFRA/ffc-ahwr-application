const util = require('util')
const { set } = require('../repositories/application-repository')
const { applicationResponseMsgType, applicationResponseQueue } = require('../config')
const sendMessage = require('../messaging/send-message')
const { notify: { templateIdFarmerApplicationComplete } } = require('../config')
const sendEmail = require('../lib/send-email')

const processApplication = async (msg) => {
  const responseMessage = msg.body
  let reference = ''
  try {
    console.log('Application received:', util.inspect(msg.body, false, null, true))
    // Get ID
    const result = await set({
      reference,
      data: JSON.stringify(msg.body),
      createdBy: 'admin',
      createdAt: new Date()
    })
    // GetReference for ID
    const application = result.dataValues
    reference = msg.body.applicationReference = application.reference
    await sendMessage(msg.body, applicationResponseMsgType, applicationResponseQueue, { sessionId: msg.body.sessionId })
  } catch {
    responseMessage.error = {
      message: 'can\'t submit application at this time.'
    }
  } finally {
    const result = await sendEmail(templateIdFarmerApplicationComplete, msg.body.organisation.email, { personalisation: { name: msg.body.organisation.name, reference }, reference })

    if (!result) {
      responseMessage.error = {
        message: 'can\'t send message.'
      }
    }
  }
  return responseMessage
}

module.exports = processApplication
