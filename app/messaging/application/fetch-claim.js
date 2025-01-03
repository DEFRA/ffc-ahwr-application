import { getByEmail } from '../../repositories/application-repository.js'
import { sendMessage } from '../send-message.js'
import { config } from '../../config/index.js'
import { messagingStates } from '../../constants/index.js'
import { validateFetchClaim } from '../schema/fetch-claim-schema.js'

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
