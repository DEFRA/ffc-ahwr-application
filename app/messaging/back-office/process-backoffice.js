const { searchApplications } = require('../../repositories/application-repository')
const { backOfficeResponseMsgType, backOfficeResponseQueue } = require('../../config')
const sendMessage = require('../../messaging/send-message')
const util = require('util')
const processBackOfficeRequest = async (msg) => {
  const responseMessage = msg.body
  const { sessionId } = msg
  try {
    console.log('search request received:', util.inspect(msg.body, false, null, true))
    // Search application with SBI number/Reference/Status and return requested page for selected offset and limit.
    const { applications, total } = await searchApplications(msg.body.search.text, msg.body.search.type ?? 'sbi', msg.body.offset, msg.body.limit)

    await sendMessage({ applications, total }, backOfficeResponseMsgType, backOfficeResponseQueue, { sessionId })
  } catch (err) {
    console.error(err)
    responseMessage.error = {
      message: 'unable to retrieve applications'
    }
    await sendMessage({ applications: [], total: 0 }, backOfficeResponseMsgType, backOfficeResponseQueue, { sessionId })
  }
  return responseMessage
}

module.exports = processBackOfficeRequest
