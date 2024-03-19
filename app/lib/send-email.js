const notifyClient = require('./notify-client')
const { applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue } = require('../config')
const { carbonCopyEmailAddress, templateIdFarmerClaimComplete } = require('../config').notify
const sendMessage = require('../messaging/send-message')
const appInsights = require('applicationinsights')

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
    appInsights.defaultClient.trackEvent({
      name: 'email',
      properties: {
        status: success,
        reference,
        email,
        templateId
      }
    })
  } catch (e) {
    appInsights.defaultClient.trackException({ exception: e })
    success = false
    console.error(`Error occurred during sending email: ${JSON.stringify(e.response.data)}`)
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

const sendFarmerConfirmationEmail = async (reference, sbi, whichSpecies, startDate, email, farmerName, orgName, orgEmail) => {
  if (orgEmail) {
    await sendMessage({ reference, sbi, whichSpecies, startDate, orgEmail, farmerName, orgName }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
  }
  await sendMessage({ reference, sbi, whichSpecies, startDate, email, farmerName, orgName }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
}

const sendFarmerClaimConfirmationEmail = async (email, reference) => {
  const personalisation = { reference }
  return sendEmail(email, personalisation, reference, templateIdFarmerClaimComplete)
}

module.exports = {
  sendFarmerConfirmationEmail,
  sendFarmerClaimConfirmationEmail
}
