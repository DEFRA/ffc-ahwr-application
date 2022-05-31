const util = require('util')
const { getAll } = require('../repositories/application-repository')
const { backOfficeResponseMsgType, backOfficeResponseQueue } = require('../config')
const sendMessage = require('../messaging/send-message')

const processBackOfficeRequest = async (msg) => {
  const responseMessage = msg.body
  const { sessionId } = msg
  try {
    console.log('BackOffice Request received:', util.inspect(msg.body, false, null, true))
    // Get ID
    const result = await getAll(msg.body.page ?? 1)
    // Get All Applications
    const applications = result.dataValues
    msg.body.applications = applications
    await sendMessage(msg.body, backOfficeResponseMsgType, backOfficeResponseQueue, { sessionId })
  } catch (err) {
    console.error(err)
    responseMessage.error = {
      message: 'can\'t submit applications at this time.'
    }
  }
  return responseMessage
}

module.exports = processBackOfficeRequest
