const util = require('util')
const states = require('./states')
const { vetVisitResponseMsgType, applicationResponseQueue } = require('../../config')
const { sendFarmerClaimInvitationEmail, sendFarmerVetRecordIneligibleEmail, sendVetConfirmationEmail } = require('../../lib/send-email')
const sendMessage = require('../send-message')
const { get, updateByReference } = require('../../repositories/application-repository')
const { set } = require('../../repositories/vet-visit-repository')

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

    if (farmerApplication?.claimed) {
      return sendMessage({ applicationState: states.alreadyClaimed }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
    }

    await set({
      applicationReference: reference,
      data: msgBody,
      createdBy: 'admin',
      createdAt: new Date()
    })

    await updateByReference({ reference, statusId: 3, updatedBy: 'admin' })

    await sendVetConfirmationEmail(msgBody.signup.email, reference)
    if (msgBody.eligibleSpecies === 'yes') {
      await sendFarmerClaimInvitationEmail(farmerApplication.data.organisation.email, reference)
    } else {
      await sendFarmerVetRecordIneligibleEmail(msgBody.signup.email, reference)
    }

    await sendMessage({ applicationState: states.submitted }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
  } catch (error) {
    console.error(`failed to process vet visit request ${JSON.stringify(error)}`, error)
    return sendMessage({ applicationState: states.failed }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
  }
}

module.exports = processVetVisit
