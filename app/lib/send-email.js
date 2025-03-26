import { config } from '../config/index.js'
import { sendMessage } from '../messaging/send-message.js'
import applicationInsights from 'applicationinsights'
import { sendSFDEmail } from './sfd-client.js'

const { applicationEmailDocRequestMsgType, applicationDocCreationRequestQueue } = config

const AddressType = {
  ORG_EMAIL: 'orgEmail',
  EMAIL: 'email',
  CC: 'CC'
}

const sendEmail = async (email, personalisation, reference, templateId, addressType) => {
  let success = true
  try {
    await sendSFDEmail(templateId, email, { personalisation, reference })

    applicationInsights.defaultClient.trackEvent({
      name: 'claim-email-requested',
      properties: {
        status: success,
        reference,
        addressType,
        templateId
      }
    })
  } catch (e) {
    applicationInsights.defaultClient.trackException({ exception: e })
    success = false
  }
  return success
}

const sendCarbonCopy = async (templateId, personalisation, reference) => {
  if (config.notify.carbonCopyEmailAddress) {
    await sendSFDEmail(
      templateId,
      config.notify.carbonCopyEmailAddress,
      personalisation
    )

    applicationInsights.defaultClient.trackEvent({
      name: 'claim-email-requested',
      properties: {
        status: true,
        reference,
        addressType: AddressType.CC,
        templateId
      }
    })
  }
}

// As it's not obvious - this function send a message out to document generator for the application
// It is NOT sending the email here.
export const sendFarmerConfirmationEmail = async (emailParams) => {
  const { reference, sbi, whichSpecies, startDate, userType, email, farmerName, orgData: { orgName, orgEmail, crn } } = emailParams
  const message = { crn, reference, sbi, whichSpecies, startDate, userType, email, farmerName, name: orgName, ...(orgEmail && { orgEmail }) }

  return sendMessage(message, applicationEmailDocRequestMsgType, applicationDocCreationRequestQueue)
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
  await sendCarbonCopy(templateId, { personalisation }, reference)

  isSuccessful = email && await sendEmail(email, personalisation, reference, templateId, AddressType.EMAIL)

  if (orgData?.orgEmail && orgData?.orgEmail !== email) {
    email = orgData?.orgEmail

    isSuccessful = await sendEmail(email, personalisation, reference, templateId, AddressType.ORG_EMAIL)
  }
  return isSuccessful
}
