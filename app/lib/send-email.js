const notifyClient = require('./notify-client')
const { serviceUri, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue } = require('../config')
const { templateIdVetApplicationComplete, templateIdFarmerApplicationClaim, templateIdFarmerClaimComplete, templateIdFarmerVetRecordIneligible } = require('../config').notify
const sendMessage = require('../messaging/send-message')

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

const sendFarmerConfirmationEmail = async (reference, sbi, whichSpecies) => {
  await sendMessage({ reference, sbi, whichSpecies }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
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

const sendFarmerVetRecordIneligibleEmail = async (email, reference) => {
  const personalisation = { reference }
  return sendEmail(email, personalisation, reference, templateIdFarmerVetRecordIneligible)
}

module.exports = {
  sendFarmerClaimInvitationEmail,
  sendFarmerConfirmationEmail,
  sendFarmerClaimConfirmationEmail,
  sendFarmerVetRecordIneligibleEmail,
  sendVetConfirmationEmail
}
