const util = require('util')
const { getByEmail } = require('../repositories/application-repository')
const sendMessage = require('../messaging/send-message')
const { fetchClaimResponseMsgType, applicationResponseQueue } = require('../config')

const fetchClaim = async (message) => {
  try {
    const msgBody = message.body
    console.log('received claim fetch request', util.inspect(msgBody, false, null, true))
    const claim = await getByEmail(msgBody.email)

    if (!claim) {
      return sendMessage({ applicationState: 'not_exist' }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
    }

    await sendMessage(claim, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
  } catch (error) {
    console.error(`failed to fetch claim for request ${JSON.stringify(message.body)}`, error)
  }
}

module.exports = fetchClaim
