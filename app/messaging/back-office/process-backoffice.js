const util = require('util')
const { getAll, getApplicationCount } = require('../../repositories/application-repository')
const { backOfficeResponseMsgType, backOfficeResponseQueue } = require('../../config')
const sendMessage = require('../../messaging/send-message')
const states = require('../states')

const processBackOfficeRequest = async (msg) => {
  const responseMessage = msg.body
  const { sessionId } = msg
  try {
    console.log('BackOffice Request received:', util.inspect(msg.body, false, null, true))
    // Get ID
    const result = await getAll(msg.body.search.text, msg.body.limit ?? 10, msg.body.offset ?? 0)
    const total = await getApplicationCount(msg.body.search.text)
    if (result.length <= 0) {
      await sendMessage({ applicationState: states.notFound, applications: [], total: 0 }, backOfficeResponseMsgType, backOfficeResponseQueue, { sessionId })
    } else {
    // Get All Applications
      await sendMessage({ applicationState: states.submitted, applications: result, total }, backOfficeResponseMsgType, backOfficeResponseQueue, { sessionId })
    }
  } catch (err) {
    console.error(err)
    responseMessage.error = {
      message: 'can\'t submit applications at this time.'
    }
    await sendMessage({ applicationState: states.notFound, applications: [], total: 0 }, backOfficeResponseMsgType, backOfficeResponseQueue, { sessionId })
  }
  return responseMessage
}

module.exports = processBackOfficeRequest
