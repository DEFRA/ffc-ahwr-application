import { messagingStates, applicationStatus } from '../../constants'
import { config } from '../../config'
import { sendFarmerConfirmationEmail } from '../../lib/send-email'
import { sendMessage } from '../send-message'
import { validateApplication } from '../schema/process-application-schema'
import appInsights from 'applicationinsights'
import { createApplicationReference } from '../../lib/create-reference'
import { getBySbi, setApplication } from '../../repositories/application-repository'

export const isPreviousApplicationRelevant = (existingApplication) => {
  return existingApplication?.type === 'EE' && ![applicationStatus.withdrawn, applicationStatus.notAgreed].includes(existingApplication?.statusId)
}

export const processApplicationApi = async (body) => {
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

export const processApplication = async (data) => {
  let existingApplicationReference = null

  try {
    if (!validateApplication(data)) {
      throw new Error('Application validation error')
    }

    const existingApplication = await getBySbi(
      data.organisation.sbi
    )

    if (isPreviousApplicationRelevant(existingApplication)) {
      existingApplicationReference = existingApplication.dataValues.reference
      throw Object.assign(
        new Error(
            `Recent application already exists: ${JSON.stringify({
              reference: existingApplication.dataValues.reference,
              createdAt: 'TODO' // createdAt doesnt exist on the application object
            })}`
        ),
        {
          applicationState: messagingStates.alreadyExists
        }
      )
    }

    const result = await setApplication({
      reference: createApplicationReference(data.reference),
      data,
      createdBy: 'admin',
      createdAt: new Date(),
      statusId: data.offerStatus === 'rejected' ? 7 : 1,
      type: data.type ? data.type : 'VV'
    })
    const application = result.dataValues

    const response = {
      applicationState: messagingStates.submitted,
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
            orgEmail: data.organisation.orgEmail,
            crn: data.organisation?.crn
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
      applicationState: messagingStates.failed,
      applicationReference: existingApplicationReference
    }
  }
}

export const processApplicationQueue = async (msg) => {
  const { sessionId } = msg
  const applicationData = msg.body

  const response = await processApplication(applicationData)

  await sendMessage(response, config.applicationResponseMsgType, config.applicationResponseQueue, { sessionId })

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
