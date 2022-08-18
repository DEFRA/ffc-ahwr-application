const util = require('util')
const { get } = require('../../repositories/application-repository')
const sendMessage = require('../send-message')
const { fetchApplicationResponseMsgType, applicationResponseQueue } = require('../../config')
const states = require('./states')
const validateFetchApplication = require('./schema/fetch-application-schema')

const fetchApplication = async (message) => {
  const { sessionId } = message
  try {
    const msgBody = message.body
    console.log('received application fetch request', util.inspect(msgBody, false, null, true))

    if (validateFetchApplication(msgBody)) {
      const application = (await get(msgBody.applicationReference)).dataValues

      if (!application) {
        return sendMessage({ applicationState: states.notFound, ...application }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
      }

      if (application?.vetVisit?.dataValues) {
        return sendMessage({ applicationState: states.alreadySubmitted, ...application }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
      }

      await sendMessage({ applicationState: states.notSubmitted, ...application }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
    } else {
      return sendMessage({ applicationState: states.failed }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
    }
  } catch (error) {
    console.error(`failed to fetch application for request ${JSON.stringify(message.body)}`, error)
    return sendMessage({ applicationState: states.failed }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
  }
}

module.exports = fetchApplication
