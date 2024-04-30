const states = require('./states')
const applicationStatus = require('../../constants/application-status')
const { applicationResponseMsgType, applicationResponseQueue, tenMonthRule, endemics } = require('../../config')
const { sendFarmerConfirmationEmail } = require('../../lib/send-email')
const sendMessage = require('../send-message')
const applicationRepository = require('../../repositories/application-repository')
const validateApplication = require('../schema/process-application-schema')
const appInsights = require('applicationinsights')

function timeLimitDates (application) {
  const start = new Date(application.createdAt)
  const end = new Date(start)
  // refactor to set time limit to a constant - config??
  end.setMonth(end.getMonth() + 10)
  end.setHours(23, 59, 59, 999) // set to midnight of agreement end day
  return { startDate: start, endDate: end }
}

function isPastTimeLimit (dates) {
  const { endDate } = dates
  return Date.now() > endDate
}

function isPreviousApplicationRelevant (existingApplication) {
  if (endemics.enabled) {
    if (existingApplication?.type === 'EE') {
      return true
    }
    return false
  } else if (tenMonthRule.enabled) {
    return existingApplication &&
      ((existingApplication.statusId !== applicationStatus.withdrawn &&
        existingApplication.statusId !== applicationStatus.notAgreed &&
        // check if it passes 10 month rule here and chuck error if it doesn't
        isPastTimeLimit(timeLimitDates(existingApplication)) === false) ||
        existingApplication.statusId === applicationStatus.agreed)
  } else {
    return existingApplication &&
      existingApplication.statusId !== applicationStatus.withdrawn &&
      existingApplication.statusId !== applicationStatus.notAgreed
  }
}

const processApplicationApi = async (body) => {
  const response = await processApplication(body)

  appInsights.defaultClient.trackEvent({
    name: 'process-application-api',
    properties: {
      status: body?.offerStatus,
      reference: response?.applicationReference,
      sbi: body?.organisation?.sbi
    }

  })
  return response
}

const processApplication = async (data) => {
  let existingApplicationReference = null

  console.log(`processing Application : ${JSON.stringify(data)}`)
  try {
    // validation
    if (!validateApplication(data)) {
      throw new Error('Application validation error')
    }
    // exisiting application
    const existingApplication = await applicationRepository.getBySbi(
      data.organisation.sbi
    )

    if (isPreviousApplicationRelevant(existingApplication)) {
      existingApplicationReference = existingApplication.dataValues.reference
      throw Object.assign(
        new Error(
            `Recent application already exists: ${JSON.stringify({
              reference: existingApplication.dataValues.reference,
              createdAt: existingApplication.createdAt
            })}`
        ),
        {
          applicationState: states.alreadyExists
        }
      )
    }

    // create application = save in database
    const result = await applicationRepository.set({
      reference: '',
      data,
      createdBy: 'admin',
      createdAt: new Date(),
      statusId: data.offerStatus === 'rejected' ? 7 : 1,
      type: data.type ? data.type : 'VV'
    })
    const application = result.dataValues

    const response = {
      applicationState: states.submitted,
      applicationReference: application.reference
    }
    // send email to farmer if application is accepted

    if (data.offerStatus === 'accepted') {
      try {
        sendFarmerConfirmationEmail(
          application.reference,
          data.organisation.sbi,
          data.whichReview,
          application.createdAt,
          data.organisation.email,
          data.organisation.farmerName,
          {
            orgName: data.organisation?.name,
            orgEmail: data.organisation?.orgEmail
          }
        )
      } catch (error) {
        console.error('Failed to send farmer confirmation email', error)
      }
    }

    return response
  } catch (error) {
    console.error('Failed to process application', error)
    appInsights.defaultClient.trackException({ exception: error })

    return {
      applicationState: states.failed,
      applicationReference: existingApplicationReference
    }
  }
}

const processApplicationQueue = async (msg) => {
  const { sessionId } = msg
  const applicationData = msg.body

  const response = await processApplication(applicationData)

  await sendMessage(response, applicationResponseMsgType, applicationResponseQueue, { sessionId })

  appInsights.defaultClient.trackEvent({
    name: 'process-application-queue',
    properties: {
      status: applicationData?.offerStatus,
      reference: response?.applicationReference,
      sbi: applicationData?.organisation?.sbi,
      sessionId
    }
  })
}

const processApplicationOld = async (msg) => {
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
      applicationData.organisation.sbi
    )

    if (isPreviousApplicationRelevant(existingApplication)) {
      existingApplicationReference = existingApplication.dataValues.reference
      throw Object.assign(
        new Error(
          `Recent application already exists: ${JSON.stringify({
            reference: existingApplication.dataValues.reference,
            createdAt: existingApplication.createdAt
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
      statusId: applicationData.offerStatus === 'rejected' ? 7 : 1,
      type: applicationData.type ? applicationData.type : 'VV'
    })
    const application = result.dataValues

    const response = {
      applicationState: states.submitted,
      applicationReference: application.reference
    }

    console.log(`Returning response : ${JSON.stringify(response)} with sessionID ${sessionId} and messageID ${messageId}.`)
    if (messageId !== 'RESTAPI') {
      await sendMessage(response, applicationResponseMsgType, applicationResponseQueue, { sessionId })
    }

    const { organisation: { sbi, userType, email, farmerName, name, orgEmail }, whichReview } = applicationData
    const { reference, createdAt: startDate } = application
    const orgData = { orgName: name, orgEmail }

    if (applicationData.offerStatus === 'accepted') {
      await sendFarmerConfirmationEmail({
        reference,
        sbi,
        whichReview,
        startDate,
        userType,
        email,
        farmerName,
        orgData
      })
    }

    appInsights.defaultClient.trackEvent({
      name: 'process-application',
      properties: {
        status: applicationData?.offerStatus,
        reference: application ? application?.reference : 'unknown',
        sbi: applicationData?.organisation?.sbi,
        sessionId
      }
    })
    if (messageId === 'RESTAPI') {
      return response
    }
  } catch (error) {
    console.error('Failed to process application', error)
    appInsights.defaultClient.trackException({ exception: error })
    const errorResponse = {
      applicationState: states.failed,
      applicationReference: existingApplicationReference
    }
    if (messageId !== 'RESTAPI') {
      sendMessage(
        errorResponse,
        applicationResponseMsgType,
        applicationResponseQueue,
        {
          sessionId
        }
      )
    } else {
      return errorResponse
    }
  }
}

module.exports = {
  processApplication,
  processApplicationOld,
  processApplicationApi,
  processApplicationQueue
}
