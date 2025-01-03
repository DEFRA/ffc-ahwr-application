import { getApplication } from '../../repositories/application-repository.js'
import { sendMessage } from '../send-message.js'
import { config } from '../../config/index.js'
import { messagingStates } from '../../constants/index.js'
import { validateFetchApplication } from '../schema/fetch-application-schema.js'

const { fetchApplicationResponseMsgType, applicationResponseQueue } = config
const { notFound, alreadySubmitted, notSubmitted, failed } = messagingStates

export const fetchApplication = async (message) => {
  const { sessionId } = message
  try {
    const msgBody = message.body

    if (validateFetchApplication(msgBody)) {
      const application = (await getApplication(msgBody.applicationReference)).dataValues

      if (!application) {
        return sendMessage({ applicationState: notFound, ...application }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
      }

      if (application?.vetVisit?.dataValues) {
        return sendMessage({ applicationState: alreadySubmitted, ...application }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
      }

      await sendMessage({ applicationState: notSubmitted, ...application }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
    } else {
      return sendMessage({ applicationState: failed }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
    }
  } catch (error) {
    console.error('failed to fetch application for request', error)
    return sendMessage({ applicationState: failed }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
  }
}
