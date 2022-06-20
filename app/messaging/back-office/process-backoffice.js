const { getAll, getApplicationCount } = require('../../repositories/application-repository')
const { backOfficeResponseMsgType, backOfficeResponseQueue } = require('../../config')
const sendMessage = require('../../messaging/send-message')

const processBackOfficeRequest = async (msg) => {
  const responseMessage = msg.body
  const { sessionId } = msg
  try {
    // Search application with SBI number and return requested page for selected offset and limit.
    const applications = await getAll(msg.body.search.text, msg.body.offset, msg.body.limit)
    const total = await getApplicationCount(msg.body.search.text)
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
