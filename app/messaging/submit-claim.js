const util = require('util')
const { alreadyClaimed, failed, error, notFound, success } = require('./states')
const { applicationResponseQueue, submitClaimResponseMsgType } = require('../config')
const { get, updateByReference } = require('../repositories/application-repository')
const { sendFarmerClaimConfirmationEmail } = require('../lib/send-email')
const sendMessage = require('../messaging/send-message')

function isUpdateSuccessful (res) {
  return res[0] === 1
}

const submitClaim = async (message) => {
  try {
    const msgBody = message.body
    console.log('received claim submit request', util.inspect(msgBody, false, null, true))

    const { reference } = msgBody
    const application = await get(reference)

    if (!application.dataValues) {
      return sendMessage({ state: notFound }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
    }

    if (application.dataValues.claimed) {
      return sendMessage({ state: alreadyClaimed }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
    }
    const res = await updateByReference({ reference, claimed: true, updatedBy: 'admin' })

    if (isUpdateSuccessful(res)) {
      await sendFarmerClaimConfirmationEmail(application.dataValues.data.organisation.email, reference)
    }

    await sendMessage({ state: isUpdateSuccessful(res) ? success : failed }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
  } catch (err) {
    console.error(`failed to submit claim for request ${JSON.stringify(message.body)}`, err)
    return sendMessage({ state: error }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
  }
}

module.exports = submitClaim