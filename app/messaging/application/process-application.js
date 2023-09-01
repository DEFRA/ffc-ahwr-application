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

  try {
    if (!validateApplication(applicationData)) {
      throw new Error('Application validation error')
    }

    console.log(`Application received : ${JSON.stringify(applicationData)} with sessionID ${sessionId} and messageID ${messageId}.`)

    function timeLimitDates (application) {
      const start = new Date(application.createdAt)
      const end = new Date(start)
      // set time limit to a constant - config??
      end.setMonth(end.getMonth() + 10)
      end.setHours(24, 0, 0, 0) // set to midnight of agreement end day
      return { startDate: start, endDate: end }
    }

    function isPastTimeLimit (dates) {
      const { endDate } = dates
      return Date.now() > endDate
    }

    // Alex to fix so only latest application returned
    const existingApplication = await applicationRepository.getBySbi(
      applicationData.organisation.sbi // todo consider reworking this for re application logic as this could pull back more than one agreement
    )

    if (
      existingApplication &&
      existingApplication.statusId !== applicationStatus.withdrawn &&
      existingApplication.statusId !== applicationStatus.notAgreed
    ) {
      // check if it passes 10 month rule here and chuck error if it doesn't
      const dates = timeLimitDates(existingApplication)
      if (isPastTimeLimit(dates)) {
        return
      }

      existingApplicationReference = existingApplication.dataValues.reference
      throw Object.assign(
        new Error(
          `Recent application already exists: ${JSON.stringify({
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
