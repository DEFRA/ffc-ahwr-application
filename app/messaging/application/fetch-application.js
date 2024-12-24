import { get } from '../../repositories/application-repository'
import { sendMessage } from '../send-message'
import { config } from '../../config'
import { states } from './states'
import validateFetchApplication from '../schema/fetch-application-schema'

const { fetchApplicationResponseMsgType, applicationResponseQueue } = config
const { notFound, alreadySubmitted, notSubmitted, failed } = states

export const fetchApplication = async (message) => {
  const { sessionId } = message
  try {
    const msgBody = message.body

    if (validateFetchApplication(msgBody)) {
      const application = (await get(msgBody.applicationReference)).dataValues

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
