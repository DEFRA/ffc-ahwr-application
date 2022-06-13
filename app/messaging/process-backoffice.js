const util = require('util')
const { getAll, getApplicationCount } = require('../repositories/application-repository')
const { backOfficeResponseMsgType, backOfficeResponseQueue } = require('../config')
const sendMessage = require('../messaging/send-message')

const processBackOfficeRequest = async (msg) => {
  const responseMessage = msg.body
  const { sessionId } = msg
  try {
    console.log('BackOffice Request received:', util.inspect(msg.body, false, null, true))
    // Get ID
    const result = await getAll(msg.body.limit ?? 10, msg.body.offset ?? 0, msg.body.search.text)
    const total = await getApplicationCount(msg.body.search.text)
    // Get All Applications
    await sendMessage({ applications: result, total }, backOfficeResponseMsgType, backOfficeResponseQueue, { sessionId })
  } catch (err) {
    console.error(err)
    responseMessage.error = {
      message: 'can\'t submit applications at this time.'
    }
  }
  return responseMessage
}

module.exports = processBackOfficeRequest
