const util = require('util')
const config = require('../config')
const sendMessage = require('../messaging/send-message')
const { sfdRequestMsgType, sfdMessageQueue } = require('../config')
const validateSFDClaim = require('../messaging/schema/submit-sfd-schema')
const { get } = require('../repositories/application-repository')
const states = require('../messaging/application/states')

const sendSFDEmail = async (templateId, email, personalisation) => {
    try {
        const { personalisation: { applicationReference } } = personalisation
        const { personalisation: { reference } } = personalisation
        const application = await get(applicationReference)

        if (!application.dataValues) {
            return sendMessage({ state: notFound }, sfdRequestMsgType, sfdMessageQueue, { templateId })
        }

        sfdMessage = {
            crn: application.dataValues.data.organisation.crn,
            sbi: application.dataValues.data.organisation.sbi,
            agreementReference: applicationReference,
            claimReference: reference,
            notifyTemplateId: templateId,
            emailAddress: email,
            customParams: personalisation,
            dateTime: new Date().toISOString()
        }

        if (validateSFDClaim(sfdMessage)) {
            return await sendMessage(sfdMessage, sfdRequestMsgType, sfdMessageQueue)
        } else {
            return sendMessage({ applicationState: states.failed }, sfdRequestMsgType, sfdMessageQueue, { templateId })
        }
    } catch (error) {
        console.error(`failed to fetch application for request ${JSON.stringify(templateId)}`, error)
        return sendMessage({ applicationState: states.failed }, sfdRequestMsgType, sfdMessageQueue, { templateId })
    }
}

module.exports = sendSFDEmail
