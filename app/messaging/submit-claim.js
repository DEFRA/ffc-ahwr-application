const util = require('util')
const { get, updateByReference } = require('../repositories/application-repository')
const sendMessage = require('../messaging/send-message')
const { applicationResponseQueue, submitClaimResponseMsgType } = require('../config')
const { alreadyClaimed, failed, error, notExist, success } = require('./states')

const submitClaim = async (message) => {
  try {
    const msgBody = message.body
    console.log('received claim submit request', util.inspect(msgBody, false, null, true))

    const { reference } = msgBody
    const application = await get(reference)
    console.log('application', application)

    if (!application.dataValues) {
      return sendMessage({ state: notExist }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
    }

    if (application.dataValues.claimed) {
      return sendMessage({ state: alreadyClaimed }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
    }
    const [res] = await updateByReference({ reference, claimed: true, updatedBy: 'admin' })

    await sendMessage({ state: res === 1 ? success : failed }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
  } catch (err) {
    console.error(`failed to submit claim for request ${JSON.stringify(message.body)}`, err)
    return sendMessage({ state: error }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId: message.sessionId })
  }
}

module.exports = submitClaim
