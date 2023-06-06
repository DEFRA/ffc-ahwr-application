const notifyClient = require('./notify-client')
const { serviceUri, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue } = require('../config')
const { carbonCopyEmailAddress, templateIdVetApplicationComplete, templateIdFarmerApplicationClaim, templateIdFarmerClaimComplete, templateIdFarmerVetRecordIneligible } = require('../config').notify
const sendMessage = require('../messaging/send-message')

const send = async (templateId, email, personalisation) => {
  return notifyClient.sendEmail(
    templateId,
    email,
    personalisation
  )
}

const sendEmail = async (email, personalisation, reference, templateId) => {
  let success = true
  try {
    await send(templateId, email, { personalisation, reference })
    await sendCarbonCopy(templateId, { personalisation, reference })
  } catch (e) {
    success = false
    console.error('Error occurred during sending email', e.response.data)
  }
  return success
}

const sendCarbonCopy = async (templateId, personalisation) => {
  if (carbonCopyEmailAddress) {
    await send(
      templateId,
      carbonCopyEmailAddress,
      personalisation
    )

    console.log(`Carbon copy email sent to ${carbonCopyEmailAddress} for ${personalisation.reference}`)
  }
}

const sendFarmerConfirmationEmail = async (reference, sbi, whichSpecies, startDate, email, farmerName) => {
  const message = { reference, sbi, whichSpecies, startDate, email, farmerName }
  sendMessage(message, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
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
