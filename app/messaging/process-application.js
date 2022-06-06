const util = require('util')
const states = require('./states')
const { applicationResponseMsgType, applicationResponseQueue } = require('../config')
const { sendFarmerConfirmationEmail } = require('../lib/send-email')
const sendMessage = require('../messaging/send-message')
const { set } = require('../repositories/application-repository')

const processApplication = async (msg) => {
  const { sessionId } = msg
  try {
    console.log('Application received:', util.inspect(msg.body, false, null, true))
    let reference = ''
    const result = await set({
      reference,
      data: msg.body,
      createdBy: 'admin',
      createdAt: new Date()
    })

    const application = result.dataValues
    reference = application.reference
    await sendFarmerConfirmationEmail(msg.body.organisation.email, msg.body.organisation.name, reference)
    await sendMessage({ applicationState: states.submitted, applicationReference: reference }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
  } catch (error) {
    console.error(`failed to process application ${JSON.stringify(error)}`, error)
    return sendMessage({ applicationState: states.failed }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
  }
}

module.exports = processApplication
