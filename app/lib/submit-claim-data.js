const Boom = require('@hapi/boom')
const compliance = require('../config')
const { get, updateByReference } = require('../repositories/application-repository')
const appInsights = require('applicationinsights')
const requiresComplianceCheck = require('./requires-compliance-check')
const validateSubmitClaim = require('../messaging/schema/submit-claim-schema')
const statusIds = require('../constants/application-status')
const { sendFarmerClaimConfirmationEmail } = require('./send-email')

function isUpdateSuccessful (res) {
  return res[0] === 1
}

const submitClaimData = async (claimData) => {
  try {
    const { reference, data } = claimData || {}

    const application = await get(reference)

    if (!application.dataValues) {
      throw Boom.badRequest('Application not found')
    }

    if (!validateSubmitClaim(claimData)) {
      throw Boom.badRequest('Claim data validation error')
    }

    console.log(`Claim data received : ${JSON.stringify(claimData)}`)

    const claimStatusIds = [statusIds.inCheck, statusIds.readyToPay, statusIds.rejected, statusIds.onHold, statusIds.recommendToPay, statusIds.recommendToReject]

    if (application.dataValues.claimed || claimStatusIds.includes(application.dataValues.statusId)) {
      throw Boom.badRequest('Application has already been claimed')
    }

    const { claimed, statusId } = await requiresComplianceCheck(claimStatusIds, compliance.complianceCheckRatio)

    const res = await updateByReference({ reference, claimed, statusId, updatedBy: 'admin', data })

    const updateSuccess = isUpdateSuccessful(res)
    if (!updateSuccess) {
      throw Boom.badRequest('Failed to update application')
    }

    if (updateSuccess && statusId === statusId.readyToPay) {
      console.log(`Application with reference ${reference} has been marked as ready to pay.`)
    }

    if (updateSuccess) {
      const sentConfirmationMailSucess = await sendFarmerClaimConfirmationEmail(application.dataValues.data.organisation.email, reference)
      console.log(`Confirmation email sent to farmer for application with reference ${reference} ${sentConfirmationMailSucess}}`)
      if (!sentConfirmationMailSucess) {
        throw Boom.badRequest(`Confirmation email was not sent to farmer for application with reference ${reference}`)
      }
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
    return res
  } catch (error) {
    appInsights.defaultClient.trackException({ exception: error })
    console.error(`failed to submit claim for request ${JSON.stringify(claimData)}`, error)
  }
}

module.exports = {
  submitClaimData
}
