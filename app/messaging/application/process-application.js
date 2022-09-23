const util = require('util')
const states = require('./states')
const { applicationResponseMsgType, applicationResponseQueue } = require('../../config')
const { sendFarmerConfirmationEmail } = require('../../lib/send-email')
const sendMessage = require('../send-message')
const { set } = require('../../repositories/application-repository')
const validateApplication = require('../schema/process-application-schema')

const processApplication = async (msg) => {
  const { sessionId } = msg
  try {
    const applicationData = msg.body
    console.log('Application received:', util.inspect(applicationData, false, null, true))

    if (validateApplication(applicationData)) {
      const statusId = applicationData.offerStatus === 'rejected' ? 7 : 1
      let reference = ''
      const result = await set({
        reference,
        data: applicationData,
        createdBy: 'admin',
        createdAt: new Date(),
        statusId
      })

      const application = result.dataValues
      reference = application.reference
      await sendFarmerConfirmationEmail(applicationData.organisation.email, applicationData.organisation.name, reference)
      await sendMessage({ applicationState: states.submitted, applicationReference: reference }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
    } else {
      return sendMessage({ applicationState: states.failed }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
    }
  } catch (error) {
    console.error('failed to process application', error)
    return sendMessage({ applicationState: states.failed }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
  }
}

module.exports = processApplication
