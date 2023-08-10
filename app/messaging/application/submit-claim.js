const util = require('util')
const { alreadyClaimed, failed, error, notFound, success } = require('./states')
const { applicationResponseQueue, submitClaimResponseMsgType, submitPaymentRequestMsgType, submitRequestQueue, compliance } = require('../../config')
const { sendFarmerClaimConfirmationEmail } = require('../../lib/send-email')
const sendMessage = require('../send-message')
const { get, updateByReference, getAllClaimedApplications } = require('../../repositories/application-repository')
const validateSubmitClaim = require('../schema/submit-claim-schema')
const statusIds = require('../../constants/application-status')

function isUpdateSuccessful (res) {
  return res[0] === 1
}

const submitClaim = async (message) => {
  const timestamp = Date.now()
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

/**
 * This function determines whether the claim being processed can be sent directly for payment (READY_TO_PAY) or 
 * whether it has to go through a manual compliance check (IN_CHECK)
 * @param {*} claimStatusIds an array of status IDs that represent an agreement where a claim has been made
 * @returns an object containing a statusId and a claimed indicator
 */
async function processComplianceCheck(claimStatusIds) {
  const claimedApplications = await getAllClaimedApplications(claimStatusIds)

  // default to in check
  let statusId = statusIds.inCheck
  let claimed = false

  if ((claimedApplications.length + 1) % compliance.applicationCount !== 0) {
    // if the claim does not trigger the configururable compliance check volume ratio set as ready for payment 
    statusId = statusIds.readyToPay
    claimed = true
  }
  return { claimed, statusId }
}

module.exports = submitClaim

