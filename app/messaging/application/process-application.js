const states = require('./states')
const applicationStatus = require('../../constants/application-status')
const { applicationResponseMsgType, applicationResponseQueue } = require('../../config')
const { sendFarmerConfirmationEmail } = require('../../lib/send-email')
const sendMessage = require('../send-message')
const applicationRepository = require('../../repositories/application-repository')
const validateApplication = require('../schema/process-application-schema')

const processApplication = async (msg) => {
  const { sessionId } = msg
  const applicationData = msg.body
  const messageId = msg.messageId
  let existingApplicationReference = null
  console.log(`Application received : ${JSON.stringify(applicationData)} with sessionID ${sessionId} and messageID ${messageId}.`)
  try {
    const timestamp = Date.now()

    console.time(`performance:${timestamp}:processApplication`)

    if (!validateApplication(applicationData)) {
      throw new Error('Application validation error')
    }

    const existingApplication = await applicationRepository.getBySbi(
      applicationData.organisation.sbi
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

    console.time(`performance:${timestamp}:sendMessage`)
    await sendMessage(
      {
        applicationState: states.submitted,
        applicationReference: application.reference
      },
      applicationResponseMsgType,
      applicationResponseQueue,
      {
        sessionId
      }
    )
    console.timeEnd(`performance:${timestamp}:sendMessage`)
    console.timeEnd(`performance:${timestamp}:processApplication`)

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
  } catch (error) {
    console.error('Failed to process application', error)
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
