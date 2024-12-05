const notifyClient = require('./notify-client')
const { applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue } = require('../config')
const { carbonCopyEmailAddress, templateIdFarmerClaimComplete } = require('../config').notify
const sendMessage = require('../messaging/send-message')
const appInsights = require('applicationinsights')
const sendSFDEmail = require('./sfd-client')
const { sfdMessage } = require('../config')

const send = async (templateId, email, personalisation) => {
  if (sfdMessage.enabled) {
    return sendSFDEmail(
      templateId,
      email,
      personalisation
    )
  }
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
  }
}

const sendFarmerConfirmationEmail = async (emailParams) => {
  const { reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData: { orgName, orgEmail, crn } } = emailParams
  const message = { reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgName, ...(orgEmail && { orgEmail }) }
  if (sfdMessage.enabled) {
    return await sendMessage({ ...message, crn }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
  }
  return await sendMessage(message, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
}

const sendFarmerClaimConfirmationEmail = async (email, reference, orgEmail, sbi) => {
  const personalisation = { applicationReference: reference, sbi }
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
    amount: data?.amount,
    crn: orgData?.crn,
    sbi: orgData?.sbi
  }

  if (!email && !orgData?.orgEmail) {
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
