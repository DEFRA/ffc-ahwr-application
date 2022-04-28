const util = require('util')
const { set } = require('../repositories/vet-visit-repository')
const { get } = require('../repositories/application-repository')
const sendMessage = require('../messaging/send-message')
const { vetVisitResponseMsgType, applicationResponseQueue } = require('../config')
const sendEmail = require('../lib/send-email')
const { validateApplication } = require('./validate-message')

const processVetVisit = async (message) => {
  try {
    const msgBody = message.body
    console.log('received process vet visit request', util.inspect(msgBody, false, null, true))
    const { reference } = msgBody.signup
    const farmerApplication = await get(reference)

    if (validateApplication(farmerApplication) === false) {
      return sendMessage({ applicationState: 'failed' }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
    }

    await set({
      applicationReference: reference,
      data: JSON.stringify(msgBody),
      createdBy: 'admin',
      createdAt: new Date()
    })

    sendEmail.sendVetConfirmationEmail(msgBody.signup.email, reference)
    const farmerData = JSON.parse(farmerApplication.data)
    sendEmail.sendFarmerClaimInvitationEmail(farmerData.email, reference)
    await sendMessage({ applicationState: 'submitted' }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
  } catch (error) {
    console.error(`failed to process vet visit request ${JSON.stringify(message.body)}`, error)
    return sendMessage({ applicationState: 'failed' }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId: message.body.sessionId })
  }
}

module.exports = processVetVisit
