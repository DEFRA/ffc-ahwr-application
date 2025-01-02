import { getByEmail } from '../../repositories/application-repository'
import { sendMessage } from '../send-message'
import { config } from '../../config'
import { messagingStates } from '../../constants'
import { validateFetchClaim } from '../schema/fetch-claim-schema'

const { fetchClaimResponseMsgType, applicationResponseQueue } = config
const { failed, notFound } = messagingStates

export const fetchClaim = async (message) => {
  const { sessionId } = message
  try {
    const msgBody = message.body

    if (validateFetchClaim(msgBody)) {
      const claim = (await getByEmail(msgBody.email)).dataValues

      if (!claim) {
        return sendMessage({ applicationState: notFound, ...claim }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
      }

      await sendMessage(claim, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
    } else {
      return sendMessage({ applicationState: failed }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
    }
  } catch (error) {
    console.error('failed to fetch claim for request', error)
    return sendMessage({ applicationState: failed }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
  }
}
