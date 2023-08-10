const { alreadyClaimed, failed, error, notFound, success } = require('./states')
const { applicationResponseQueue, submitClaimResponseMsgType, submitPaymentRequestMsgType, submitRequestQueue } = require('../../config')
const { sendFarmerClaimConfirmationEmail } = require('../../lib/send-email')
const sendMessage = require('../send-message')
const { get, updateByReference } = require('../../repositories/application-repository')
const validateSubmitClaim = require('../schema/submit-claim-schema')
const statusIds = require('../../constants/application-status')
const processComplianceCheck = require('../../lib/requires-compliance-check')

function isUpdateSuccessful (res) {
  return res[0] === 1
}

const submitClaim = async (message) => {
  try {
    const msgBody = message.body
    if (validateSubmitClaim(msgBody)) {
      console.log(`Received claim submit request - ${JSON.stringify(msgBody)}`)
      const { reference, data } = msgBody
      const application = await get(reference)

      if (!application.dataValues) {
        return sendMessage({ state: notFound }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
      }

      const claimStatusIds = [statusIds.inCheck, statusIds.readyToPay, statusIds.rejected]

      if (application.dataValues.claimed || claimStatusIds.includes(application.dataValues.statusId)) {
        return sendMessage({ state: alreadyClaimed }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
      }

      const { claimed, statusId } = await processComplianceCheck(claimStatusIds)

      const res = await updateByReference({ reference, claimed, statusId, updatedBy: 'admin', data })

      const updateSuccess = isUpdateSuccessful(res)

      if (updateSuccess && statusId === statusIds.readyToPay) {
        console.log(`Application with reference ${reference} has been marked as ready to pay.`)
        // sending message to payment queue
        await sendMessage(
          {
            reference,
            sbi: application.dataValues.data.organisation.sbi,
            whichReview: application.dataValues.data.whichReview
          }, submitPaymentRequestMsgType, submitRequestQueue, { sessionId: message.sessionId })
      }

      await sendMessage({ state: updateSuccess ? success : failed }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })

      if (updateSuccess) {
        await sendFarmerClaimConfirmationEmail(application.dataValues.data.organisation.email, reference)
      }
    } else {
      return sendMessage({ state: error }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
    }
  } catch (err) {
    console.error(`failed to submit claim for request ${JSON.stringify(message.body)}`, err)
    return sendMessage({ state: error }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
  }
}

module.exports = submitClaim
