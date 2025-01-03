import { sendMessage } from '../messaging/send-message.js'
import { config } from '../config/index.js'
import { validateSFDSchema } from '../messaging/schema/submit-sfd-schema.js'
import { messagingStates } from '../constants/index.js'

const { sfdRequestMsgType, sfdMessageQueue } = config

export const sendSFDEmail = async (templateId, email, emailInput) => {
  const { personalisation: { applicationReference, reference } } = emailInput
  const { crn, sbi, ...filteredPersonalisation } = emailInput.personalisation

  const sfdMessage = {
    crn,
    sbi,
    agreementReference: applicationReference,
    claimReference: reference,
    notifyTemplateId: templateId,
    emailAddress: email,
    customParams: filteredPersonalisation,
    dateTime: new Date().toISOString()
  }

  if (!validateSFDSchema(sfdMessage)) {
    return sendMessage({ sfdMessage: messagingStates.failed }, sfdRequestMsgType, sfdMessageQueue, { templateId })
  }

  return await sendMessage(sfdMessage, sfdRequestMsgType, sfdMessageQueue)
}
