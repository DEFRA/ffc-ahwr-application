const notifyClient = require('./notify-client')
const { applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue } = require('../config')
const { carbonCopyEmailAddress, templateIdFarmerClaimComplete, templateIdFarmerEndemicsClaimComplete } = require('../config').notify
const sendMessage = require('../messaging/send-message')
const appInsights = require('applicationinsights')

const send = async (templateId, email, personalisation) => {
  return notifyClient.sendEmail(
    templateId,
    email,
    personalisation
  )
}

const sendEmail = async (email, personalisation, reference, templateId, carbonEmail = false) => {
  let success = true
  try {
    await send(templateId, email, { personalisation, reference })
    if (carbonEmail) {
      await sendCarbonCopy(templateId, { personalisation, reference })
    }
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

const sendFarmerConfirmationEmail = async (emailParams) => {
  const { reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData: { orgName, orgEmail } } = emailParams

  return await sendMessage({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgName, ...(orgEmail && { orgEmail }) }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
}

const sendFarmerClaimConfirmationEmail = async (email, reference, orgEmail) => {
  const personalisation = { reference }
  if (orgEmail && orgEmail !== email) { sendEmail(orgEmail, personalisation, reference, templateIdFarmerClaimComplete) }
  return sendEmail(email, personalisation, reference, templateIdFarmerClaimComplete, true)
}

const sendFarmerEndemicsClaimConfirmationEmail = async (data) => {
  let carbonEmail = false
  let email = data?.email
  let templateId = templateIdFarmerEndemicsClaimComplete

  const { orgData, reference } = data || {}
  const personalisation = {
    reference,
    amount: data?.amount || '£[amount]'
  }

  if (orgData?.orgEmail && orgData?.orgEmail !== email) {
    email = orgData?.orgEmail
    carbonEmail = true
  }

  return await sendEmail(email, personalisation, reference, templateId, carbonEmail)
}

module.exports = {
  sendFarmerConfirmationEmail,
  sendFarmerClaimConfirmationEmail,
  sendFarmerEndemicsClaimConfirmationEmail
}
