import { sendMessage } from '../messaging/send-message'
import { config } from '../config'
import { validateSFDSchema } from '../messaging/schema/submit-sfd-schema'
import { states } from '../messaging/application/states'

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

  if (validateSFDSchema(sfdMessage)) {
    return await sendMessage(sfdMessage, sfdRequestMsgType, sfdMessageQueue)
  } else {
    return sendMessage({ sfdMessage: states.failed }, sfdRequestMsgType, sfdMessageQueue, { templateId })
  }
}
