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
  const { reference, sbi, whichSpecies, startDate, userType, email, farmerName, userTypeStatus, orgData: { orgName, orgEmail } } = emailParams

  return await sendMessage({ reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgName, userTypeStatus, ...(orgEmail && { orgEmail }) }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
}

const sendFarmerClaimConfirmationEmail = async (email, reference, orgEmail) => {
  const personalisation = { reference }
  if (orgEmail && orgEmail !== email) { sendEmail(orgEmail, personalisation, reference, templateIdFarmerClaimComplete) }
  return sendEmail(email, personalisation, reference, templateIdFarmerClaimComplete, true)
}

const sendFarmerEndemicsClaimConfirmationEmail = async (data, templateId) => {
  const { orgData, reference, applicationReference } = data || {}
  let email = data?.email
  let isSuccessful = true

  const personalisation = {
    reference,
    applicationReference,
    amount: data?.amount
  }

  if (!email && !orgData?.orgEmail) {
    console.error(`Email addresses not found for ${reference}`)
    return false
  }
  await sendCarbonCopy(templateId, { personalisation })

  isSuccessful = email && await sendEmail(email, personalisation, reference, templateId)

  if (orgData?.orgEmail && orgData?.orgEmail !== email) {
    email = orgData?.orgEmail

    isSuccessful = await sendEmail(email, personalisation, reference, templateId)
  }
  return isSuccessful
}

module.exports = {
  sendFarmerConfirmationEmail,
  sendFarmerClaimConfirmationEmail,
  sendFarmerEndemicsClaimConfirmationEmail
}
