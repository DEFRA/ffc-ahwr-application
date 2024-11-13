const sendMessage = require('../messaging/send-message')
const { sfdRequestMsgType, sfdMessageQueue } = require('../config')
const validateSFDClaim = require('../messaging/schema/submit-sfd-schema')
const states = require('../messaging/application/states')

const sendSFDEmail = async (templateId, email, emailInput) => {
  const { personalisation: { applicationReference, reference, crn, sbi } } = emailInput
  const customParams = { ...emailInput.personalisation }
  delete customParams.crn
  delete customParams.sbi

  const sfdMessage = {
    crn,
    sbi,
    agreementReference: applicationReference,
    claimReference: reference,
    notifyTemplateId: templateId,
    emailAddress: email,
    customParams,
    dateTime: new Date().toISOString()
  }

  if (validateSFDClaim(sfdMessage)) {
    return await sendMessage(sfdMessage, sfdRequestMsgType, sfdMessageQueue)
  } else {
    return sendMessage({ applicationState: states.failed }, sfdRequestMsgType, sfdMessageQueue, { templateId })
  }
}

module.exports = sendSFDEmail
