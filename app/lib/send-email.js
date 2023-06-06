const notifyClient = require('./notify-client')
const { applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue } = require('../config')
const { carbonCopyEmailAddress, templateIdFarmerClaimComplete } = require('../config').notify
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
  sendMessage({ reference, sbi, whichSpecies, startDate, email, farmerName }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
}

const sendFarmerClaimConfirmationEmail = async (email, reference) => {
  const personalisation = { reference }
  return sendEmail(email, personalisation, reference, templateIdFarmerClaimComplete)
}

module.exports = {
  sendFarmerConfirmationEmail,
  sendFarmerClaimConfirmationEmail
}
