const sendMessage = require('../messaging/send-message')
const { sfdRequestMsgType, sfdMessageQueue } = require('../config')
const validateSFDSchema = require('../messaging/schema/submit-sfd-schema')
const states = require('../messaging/application/states')

const sendSFDEmail = async (templateId, email, emailInput) => {
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

module.exports = sendSFDEmail
