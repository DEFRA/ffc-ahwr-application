const util = require('util')
const { getByEmail } = require('../repositories/application-repository')
const sendMessage = require('../messaging/send-message')
const { fetchClaimResponseMsgType, applicationResponseQueue } = require('../config')
const { failed, notExist } = require('./states')

const fetchClaim = async (message) => {
  let claim
  try {
    const msgBody = message.body
    console.log('received claim fetch request', util.inspect(msgBody, false, null, true))
    claim = (await getByEmail(msgBody.email)).dataValues

    if (!claim) {
      return sendMessage({ applicationState: notExist, ...claim }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
    }

    await sendMessage(claim, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
  } catch (error) {
    console.error(`failed to fetch claim for request ${JSON.stringify(message.body)}`, error)
    return sendMessage({ applicationState: failed }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId: message.body.sessionId })
  }
}

module.exports = fetchClaim
