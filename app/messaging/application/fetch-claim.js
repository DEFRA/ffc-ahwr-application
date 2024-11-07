const { getByEmail } = require('../../repositories/application-repository')
const sendMessage = require('../send-message')
const { fetchClaimResponseMsgType, applicationResponseQueue } = require('../../config')
const { failed, notFound } = require('./states')
const validateFetchClaim = require('../schema/fetch-claim-schema')

const fetchClaim = async (message) => {
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

module.exports = fetchClaim
