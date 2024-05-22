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
  end.setMonth(end.getMonth() + 10)
  end.setHours(23, 59, 59, 999)
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
    const isWithinTimeLimit = existingApplication &&
      ((existingApplication.statusId !== applicationStatus.withdrawn &&
        existingApplication.statusId !== applicationStatus.notAgreed &&
        !isPastTimeLimit(timeLimitDates(existingApplication))) ||
        existingApplication.statusId === applicationStatus.agreed)
    return isWithinTimeLimit
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
    if (!validateApplication(data)) {
      throw new Error('Application validation error')
    }
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

    if (data.offerStatus === 'accepted') {
      try {
        await sendFarmerConfirmationEmail({
          reference: application.reference,
          sbi: data.organisation.sbi,
          whichSpecies: data.whichReview,
          startDate: application.createdAt,
          userType: data.organisation.userType,
          email: data.organisation.email,
          farmerName: data.organisation.farmerName,
          orgData: {
            orgName: data.organisation.name,
            orgEmail: data.organisation.orgEmail
          }
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

module.exports = {
  processApplication,
  processApplicationApi,
  processApplicationQueue
}
