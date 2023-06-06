const { alreadyClaimed, failed, error, notFound, success } = require('./states')
const { applicationResponseQueue, submitClaimResponseMsgType, submitPaymentRequestMsgType, submitRequestQueue, compliance } = require('../../config')
const { sendFarmerClaimConfirmationEmail } = require('../../lib/send-email')
const sendMessage = require('../send-message')
const { get, updateByReference, getApplicationsCount } = require('../../repositories/application-repository')
const validateSubmitClaim = require('../schema/submit-claim-schema')
const statusIds = require('../../constants/application-status')

function isUpdateSuccessful (res) {
  return res[0] === 1
}

const submitClaim = async (message) => {
  const messageBody = message.body
  const sessionId = message.sessionId
  const messageId = message.messageId
  try {
    console.log(`Claim received : ${JSON.stringify(messageBody)} with sessionID ${sessionId} and messageID ${messageId}.`)

    if (validateSubmitClaim(messageBody)) {
      const { reference, data } = messageBody
      const application = await get(reference)

      if (!application.dataValues) {
        return sendMessage({ state: notFound }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
      }

      const claimStatusIds = [5, 10, 9]

      if (application.dataValues.claimed || claimStatusIds.includes(application.dataValues.statusId)) {
        return sendMessage({ state: alreadyClaimed }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
      }

      const applicationsCount = await getApplicationsCount()

      let statusId = statusIds.readyToPay
      let claimed = true
      if (applicationsCount % compliance.applicationCount === 0) {
        statusId = statusIds.inCheck
        claimed = false
      }

      const res = await updateByReference({ reference, claimed, statusId, updatedBy: 'admin', data })

      const updateSuccess = isUpdateSuccessful(res)

      if (updateSuccess) {
        await sendFarmerClaimConfirmationEmail(application.dataValues.data.organisation.email, reference)
      }

      if (updateSuccess && statusId === statusIds.readyToPay) {
        await sendMessage(
          {
            reference,
            sbi: application.dataValues.data.organisation.sbi,
            whichReview: application.dataValues.data.whichReview
          }, submitPaymentRequestMsgType, submitRequestQueue, { sessionId })
      }

      await sendMessage({ state: updateSuccess ? success : failed }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
    } else {
      return sendMessage({ state: error }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
    }
  } catch (err) {
    console.error(`failed to submit claim for request ${JSON.stringify(messageBody)}`, err)
    return sendMessage({ state: error }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
  }
}

module.exports = submitClaim
