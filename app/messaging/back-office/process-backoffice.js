const util = require('util')
const { getAll, getApplicationCount } = require('../../repositories/application-repository')
const { backOfficeResponseMsgType, backOfficeResponseQueue } = require('../../config')
const sendMessage = require('../../messaging/send-message')
const states = require('../states')

const processBackOfficeRequest = async (msg) => {
  const responseMessage = msg.body
  const { sessionId } = msg
  try {
    // Get All Applications
    const result = await getAll(msg.body.search.text, msg.body.limit, msg.body.offset)
    const total = await getApplicationCount(msg.body.search.text)
    if (result.length <= 0) {
      await sendMessage({ applicationState: states.notFound, applications: [], total: 0 }, backOfficeResponseMsgType, backOfficeResponseQueue, { sessionId })
    } else {
      await sendMessage({ applicationState: states.submitted, applications: result, total }, backOfficeResponseMsgType, backOfficeResponseQueue, { sessionId })
    }
  } catch (err) {
    console.error(err)
    responseMessage.error = {
      message: 'unable to retrieve applications'
    }
    await sendMessage({ applicationState: states.notFound, applications: [], total: 0 }, backOfficeResponseMsgType, backOfficeResponseQueue, { sessionId })
  }
  return responseMessage
}

module.exports = processBackOfficeRequest
