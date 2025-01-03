import { notifyClient } from './notify-client.js'
import { config } from '../config/index.js'
import { sendMessage } from '../messaging/send-message.js'
import { defaultClient } from 'applicationinsights'
import { sendSFDEmail } from './sfd-client.js'

const { applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue, notify: { templateIdFarmerClaimComplete } } = config

const send = async (templateId, email, personalisation) => {
  if (config.sfdMessage.enabled) {
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
    defaultClient.trackEvent({
      name: 'email',
      properties: {
        status: success,
        reference,
        email,
        templateId
      }
    })
  } catch (e) {
    defaultClient.trackException({ exception: e })
    success = false
  }
  return success
}

const sendCarbonCopy = async (templateId, personalisation) => {
  if (config.notify.carbonCopyEmailAddress) {
    await send(
      templateId,
      config.notify.carbonCopyEmailAddress,
      personalisation
    )
  }
}

export const sendFarmerConfirmationEmail = async (emailParams) => {
  const { reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData: { orgName, orgEmail, crn } } = emailParams
  const message = { reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgName, ...(orgEmail && { orgEmail }) }
  if (config.sfdMessage.enabled) {
    return await sendMessage({ ...message, crn }, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
  }
  return await sendMessage(message, applicationEmailDocRequestMsgType, applicationdDocCreationRequestQueue)
}

export const sendFarmerClaimConfirmationEmail = async (email, reference, orgEmail, sbi) => {
  const personalisation = { applicationReference: reference, sbi }
  if (orgEmail && orgEmail !== email) { sendEmail(orgEmail, personalisation, reference, templateIdFarmerClaimComplete) }
  return sendEmail(email, personalisation, reference, templateIdFarmerClaimComplete, true)
}

export const sendFarmerEndemicsClaimConfirmationEmail = async (data, templateId) => {
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
