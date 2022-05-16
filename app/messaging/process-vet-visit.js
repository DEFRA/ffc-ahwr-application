const util = require('util')
const { set } = require('../repositories/vet-visit-repository')
const { get } = require('../repositories/application-repository')
const sendMessage = require('../messaging/send-message')
const { vetVisitResponseMsgType, applicationResponseQueue } = require('../config')
const sendEmail = require('../lib/send-email')
const states = require('./states')

const processVetVisit = async (message) => {
  const { sessionId } = message
  try {
    const msgBody = message.body
    console.log('received process vet visit request', util.inspect(msgBody, false, null, true))
    const { reference } = msgBody.signup
    const farmerApplication = await get(reference)

    if (!farmerApplication) {
      return sendMessage({ applicationState: states.notFound }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
    }

    if (farmerApplication?.vetVisit?.dataValues) {
      return sendMessage({ applicationState: states.alreadySubmitted }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
    }

    await set({
      applicationReference: reference,
      data: msgBody,
      createdBy: 'admin',
      createdAt: new Date()
    })

    await sendEmail.sendVetConfirmationEmail(msgBody.signup.email, reference)
    await sendEmail.sendFarmerClaimInvitationEmail(farmerApplication.data.organisation.email, reference)
    await sendMessage({ applicationState: states.submitted }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
  } catch (error) {
    console.error(`failed to process vet visit request ${JSON.stringify(error)}`, error)
    return sendMessage({ applicationState: states.failed }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
  }
}

module.exports = processVetVisit
