const validateApplication = require('../messaging/schema/process-application-schema')
const applicationStatus = require('../constants/application-status')
const { sendFarmerConfirmationEmail } = require('./send-email')
const { endemics, tenMonthRule } = require('../config')
const applicationRepository = require('../repositories/application-repository')
const appInsights = require('applicationinsights')
const states = require('../messaging/application/states')

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

const processApplicationData = async (applicationData, sessionId) => {
  try {
    if (!validateApplication(applicationData)) {
      throw new Error('Application validation error')
    }

    console.log(`Application received : ${JSON.stringify(applicationData)} with sessionId ${sessionId}`)

    const existingApplication = await applicationRepository.getBySbi(
      applicationData.organisation.sbi
    )

    if (isPreviousApplicationRelevant(existingApplication)) {
      throw Object.assign(
        new Error(
            `Recent application already exists: ${JSON.stringify({
              reference: existingApplication?.dataValues.reference,
              createdAt: existingApplication?.createdAt
            })}`
        ),
        {
          applicationState: states
            .alreadyExists
        }
      )
    }

    const { organisation, whichReview, offerStatus } = applicationData || {}

    const result = await applicationRepository.set({
      reference: '',
      data: applicationData,
      createdBy: 'admin',
      createdAt: new Date(),
      statusId: applicationData.offerStatus === 'rejected' ? 7 : 1,
      type: applicationData.type ? applicationData.type : 'VV'
    })
    const application = result.dataValues

    applicationData.offerStatus === 'accepted' && await sendFarmerConfirmationEmail(application?.reference, organisation?.sbi, whichReview, application?.createdAt, organisation?.email, organisation?.farmerName)

    appInsights.defaultClient.trackEvent({
      name: 'process-application',
      properties: {
        status: offerStatus,
        reference: application ? application?.reference : 'unknown',
        sbi: organisation?.sbi,
        sessionId
      }
    })

    return result
  } catch (error) {
    console.error('Failed to process application', error)
    appInsights.defaultClient.trackException({ exception: error })
  }
}

module.exports = {
  processApplicationData
}
