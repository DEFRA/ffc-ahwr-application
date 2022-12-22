const util = require('util')
const states = require('./states')
const { applicationResponseMsgType, applicationResponseQueue } = require('../../config')
const { sendFarmerConfirmationEmail } = require('../../lib/send-email')
const sendMessage = require('../send-message')
const applicationRepository = require('../../repositories/application-repository')
const validateApplication = require('../schema/process-application-schema')

const processApplication = async (msg) => {
  const { sessionId } = msg
  const applicationData = msg.body
  console.log('Application received:', util.inspect(applicationData, false, null, true))
  try {
    if (!validateApplication(applicationData)) {
      throw new Error('Application validation error')
    }

    const application = await getOrCreateApplication(applicationData)

    if (applicationData.offerStatus === 'accepted') {
      await sendFarmerConfirmationEmail(
        application.reference,
        applicationData.organisation.sbi,
        applicationData.whichReview,
        application.createdAt
      )
    }
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
  } catch (error) {
    console.error('failed to process application', error)
    sendMessage(
      {
        applicationState: states.failed
      },
      applicationResponseMsgType,
      applicationResponseQueue,
      {
        sessionId
      }
    )
  }
}

const getOrCreateApplication = async (applicationData) => {
  const existingApplication = await applicationRepository.getBySbi(
    applicationData.organisation.sbi
  )
  if (existingApplication) {
    return {
      reference: existingApplication.dataValues.reference,
      createdAt: existingApplication.dataValues.createdAt
    }
  } else {
    const newApplication = await applicationRepository.set({
      reference: '',
      data: applicationData,
      createdBy: 'admin',
      createdAt: new Date(),
      statusId: applicationData.offerStatus === 'rejected' ? 7 : 1
    })
    return {
      reference: newApplication.dataValues.reference,
      createdAt: newApplication.dataValues.createdAt
    }
  }
}

module.exports = processApplication
