const util = require('util')
const { set } = require('../repositories/vet-visit-repository')
const sendMessage = require('../messaging/send-message')
const { vetVisitResponseMsgType, applicationResponseQueue } = require('../config')

const processVetVisit = async (message) => {
  try {
    const msgBody = message.body
    let reference = ''
    console.log('received process vet visit request', util.inspect(msgBody, false, null, true))
    const { applicationReference, rsvc } = msgBody
    const result = await set({
      reference,
      applicationReference,
      rsvc,
      data: JSON.stringify(msgBody),
      createdBy: 'admin',
      createdAt: new Date()
    })

    const application = result.dataValues
    reference = msgBody.applicationReference = application.reference
    await sendMessage(msgBody, vetVisitResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
  } catch (error) {
    console.error(`failed to process vet visit request ${JSON.stringify(message.body)}`, error)
  }
}

module.exports = processVetVisit
