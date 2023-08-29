const states = require('./states')
const applicationStatus = require('../../constants/application-status')
const { applicationResponseMsgType, applicationResponseQueue } = require('../../config')
const { sendFarmerConfirmationEmail } = require('../../lib/send-email')
const sendMessage = require('../send-message')
const applicationRepository = require('../../repositories/application-repository')
const validateApplication = require('../schema/process-application-schema')
const appInsights = require('applicationinsights')

const processApplication = async (msg) => {
  const { sessionId } = msg
  const applicationData = msg.body
  const messageId = msg.messageId
  let existingApplicationReference = null
  try {
    if (!validateApplication(applicationData)) {
      throw new Error('Application validation error')
    }

    console.log(`Application received : ${JSON.stringify(applicationData)} with sessionID ${sessionId} and messageID ${messageId}.`)

    const existingApplication = await applicationRepository.getBySbi(
      applicationData.organisation.sbi // todo consider reworking this for re application logic as this could pull back more than one agreement
    )

    if (
      existingApplication &&
      existingApplication.statusId !== applicationStatus.withdrawn &&
      existingApplication.statusId !== applicationStatus.notAgreed
      // todo consider being able to apply again within 10 months
    ) {
      existingApplicationReference = existingApplication.dataValues.reference
      throw Object.assign(
        new Error(
          `Application already exists: ${JSON.stringify({
            reference: existingApplication.dataValues.reference,
            createdAt: existingApplication.dataValues.createdAt
          })}`
        ),
        {
          applicationState: states.alreadyExists
        }
      )
    }

    const result = await applicationRepository.set({
      reference: '',
      data: applicationData,
      createdBy: 'admin',
      createdAt: new Date(),
      statusId: applicationData.offerStatus === 'rejected' ? 7 : 1
    })
    const application = result.dataValues

    const response = {
      applicationState: states.submitted,
      applicationReference: application.reference
    }

    console.log(`Returning response : ${JSON.stringify(response)} with sessionID ${sessionId} and messageID ${messageId}.`)

    await sendMessage(response,
      applicationResponseMsgType,
      applicationResponseQueue,
      {
        sessionId
      }
    )

    if (applicationData.offerStatus === 'accepted') {
      await sendFarmerConfirmationEmail(
        application.reference,
        applicationData.organisation.sbi,
        applicationData.whichReview,
        application.createdAt,
        applicationData.organisation.email,
        applicationData.organisation.farmerName
      )
    }

    appInsights.defaultClient.trackEvent({
      name: 'process-application',
      properties: {
        status: applicationData.offerStatus,
        reference: application.reference,
        sbi: applicationData.organisation.sbi,
        sessionId
      }
    })
  } catch (error) {
    console.error('Failed to process application', error)
    appInsights.defaultClient.trackException({ exception: error })
    sendMessage(
      {
        applicationState: error.applicationState ? error.applicationState : states.failed,
        applicationReference: existingApplicationReference
      },
      applicationResponseMsgType,
      applicationResponseQueue,
      {
        sessionId
      }
    )
  }
}

module.exports = processApplication
