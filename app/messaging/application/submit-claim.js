const util = require('util')
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
  const timestamp = Date.now()
  try {
    const msgBody = message.body
    console.time(`performance:${timestamp}:submitClaim`)
    console.log('received claim submit request', util.inspect(msgBody, false, null, true))

    if (validateSubmitClaim(msgBody)) {
      const { reference, data } = msgBody
      const application = await get(reference)

      if (!application.dataValues) {
        return sendMessage({ state: notFound }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
      }

      const claimStatusIds = [5, 10, 9]

      if (application.dataValues.claimed || claimStatusIds.includes(application.dataValues.statusId)) {
        return sendMessage({ state: alreadyClaimed }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
      }

      const applicationsCount = await getApplicationsCount()

      let statusId = statusIds.readyToPay
      let claimed = true
      if (applicationsCount % compliance.applicationCount === 0) {
        statusId = statusIds.inCheck
        claimed = false
      }

      data.dateOfClaim = new Date()
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

      console.timeEnd(`performance:${timestamp}:submitClaim`)

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
