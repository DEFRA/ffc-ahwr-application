const util = require('util')
const { getByEmail } = require('../../repositories/application-repository')
const sendMessage = require('../send-message')
const { fetchClaimResponseMsgType, applicationResponseQueue } = require('../../config')
const { failed, notFound } = require('./states')

const fetchClaim = async (message) => {
  const { sessionId } = message
  try {
    const msgBody = message.body
    console.log('received claim fetch request', util.inspect(msgBody, false, null, true))
    const claim = (await getByEmail(msgBody.email)).dataValues

    if (!claim) {
      return sendMessage({ applicationState: notFound, ...claim }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
    }

    await sendMessage(claim, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
  } catch (error) {
    console.error(`failed to fetch claim for request ${JSON.stringify(message.body)}`, error)
    return sendMessage({ applicationState: failed }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
  }
}

module.exports = fetchClaim
