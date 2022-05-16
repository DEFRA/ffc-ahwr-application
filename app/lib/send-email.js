const notifyClient = require('./notify-client')
const { serviceUri, notify: { templateIdVetApplicationComplete, templateIdFarmerApplicationClaim, templateIdFarmerApplicationComplete, templateIdFarmerClaimComplete } } = require('../config')

const sendEmail = async (email, personalisation, reference, templateId) => {
  let success = true
  try {
    await notifyClient.sendEmail(
      templateId,
      email,
      { personalisation, reference }
    )
  } catch (e) {
    success = false
    console.error('Error occurred during sending email', e.response.data)
  }
  return success
}

const sendFarmerConfirmationEmail = async (email, name, reference) => {
  const personalisation = { name, reference }
  return sendEmail(email, personalisation, reference, templateIdFarmerApplicationComplete)
}

const sendFarmerClaimConfirmationEmail = async (email, reference) => {
  const personalisation = { reference }
  return sendEmail(email, personalisation, reference, templateIdFarmerClaimComplete)
}

const sendVetConfirmationEmail = async (email, reference) => {
  const personalisation = { reference }
  return sendEmail(email, personalisation, reference, templateIdVetApplicationComplete)
}

const sendFarmerClaimInvitationEmail = async (email, reference) => {
  const personalisation = { claimStartUrl: `${serviceUri}/farmer-claim`, reference }
  return sendEmail(email, personalisation, reference, templateIdFarmerApplicationClaim)
}

module.exports = {
  sendFarmerClaimInvitationEmail,
  sendFarmerConfirmationEmail,
  sendFarmerClaimConfirmationEmail,
  sendVetConfirmationEmail
}
