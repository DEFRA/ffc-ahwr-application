const { alreadyClaimed, failed, error, notFound, success } = require('./states')
const { applicationResponseQueue, submitClaimResponseMsgType, submitPaymentRequestMsgType, submitRequestQueue, compliance } = require('../../config')
const { sendFarmerClaimConfirmationEmail } = require('../../lib/send-email')
const sendMessage = require('../send-message')
const { get, updateByReference } = require('../../repositories/application-repository')
const validateSubmitClaim = require('../schema/submit-claim-schema')
const statusIds = require('../../constants/application-status')
const appInsights = require('applicationinsights')
const requiresComplianceCheck = require('../../lib/requires-compliance-check')

function isUpdateSuccessful (res) {
  return res[0] === 1
}

const submitClaim = async (message) => {
  const msgBody = message?.body
  const isRestApi = message?.isRestApi
  const { reference, data } = msgBody

  try {
    if (validateSubmitClaim(msgBody)) {
      console.log(`Received claim submit request - ${JSON.stringify(msgBody)}`)

      const application = await get(reference)

      console.log('application data values', application.dataValues)

      if (!application.dataValues) {
        return !isRestApi
          ? sendMessage({ state: notFound }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
          : `Application not found {state: notFound, sessionId: ${message.sessionId}} for reference ${reference} in submitClaim`
      }

      const claimStatusIds = [statusIds.inCheck, statusIds.readyToPay, statusIds.rejected, statusIds.onHold, statusIds.recommendToPay, statusIds.recommendToReject]

      if (application.dataValues.claimed || claimStatusIds.includes(application.dataValues.statusId)) {
        return !isRestApi
          ? sendMessage({ state: alreadyClaimed }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
          : `Application alreadyClaimed {state: alreadyClaimed, sessionId: ${message.sessionId}} for reference ${reference} in submitClaim`
      }

      const { claimed, statusId } = await requiresComplianceCheck(claimStatusIds, compliance.complianceCheckRatio)

      const res = await updateByReference({ reference, claimed, statusId, updatedBy: 'admin', data })

      const updateSuccess = isUpdateSuccessful(res)

      if (updateSuccess && statusId === statusIds.readyToPay) {
        console.log(`Application with reference ${reference} has been marked as ready to pay.`)
        if (!isRestApi) {
          await sendMessage(
            {
              reference,
              sbi: application.dataValues.data.organisation.sbi,
              whichReview: application.dataValues.data.whichReview
            }, submitPaymentRequestMsgType, submitRequestQueue, { sessionId: message.sessionId })
        }
      }
      if (!isRestApi) {
        await sendMessage({ state: updateSuccess ? success : failed }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
      }

      if (updateSuccess) {
        await sendFarmerClaimConfirmationEmail(application.dataValues.data.organisation.email, reference, application.dataValues.data.organisation.orgEmail)
      }

      appInsights.defaultClient.trackEvent({
        name: 'process-claim',
        properties: {
          data,
          reference,
          status: statusId,
          sbi: application.dataValues.data.organisation.sbi
        }
      })
      return updateSuccess ? success : failed
    } else {
      return !isRestApi
        ? sendMessage({ state: error }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
        : `Application validation error {state: error, sessionId: ${message.sessionId}} for reference ${reference} in submitClaim`
    }
  } catch (err) {
    appInsights.defaultClient.trackException({ exception: err })
    console.error(`failed to submit claim for request ${JSON.stringify(message.body)}`, err)
    return !isRestApi
      ? sendMessage({ state: error }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
      : `Failed to submit claim {state: error, sessionId: ${message.sessionId}} for request ${JSON.stringify(message.body)}`
  }
}

module.exports = submitClaim
