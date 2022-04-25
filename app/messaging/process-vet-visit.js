const util = require('util')
const { set } = require('../repositories/vet-visit-repository')
const sendMessage = require('../messaging/send-message')
const { vetVisitResponseMsgType, applicationResponseQueue } = require('../config')
const { notify: { templateIdVetApplicationComplete } } = require('../config')
const sendEmail = require('../lib/send-email')

const processVetVisit = async (message) => {
  try {
    const msgBody = message.body
    console.log('received process vet visit request', util.inspect(msgBody, false, null, true))
    const { reference, rcvs } = msgBody.signup
    const result = await set({
      reference: '',
      applicationReference: reference,
      rcvs,
      data: JSON.stringify(msgBody),
      createdBy: 'admin',
      createdAt: new Date()
    })

    msgBody.vetReference = result?.dataValues?.reference
    await sendEmail(
      templateIdVetApplicationComplete,
      msgBody.signup.email,
      { personalisation: { reference: msgBody.vetReference }, reference: msgBody.vetReference }
    )
    await sendMessage(msgBody, vetVisitResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
  } catch (error) {
    console.error(`failed to process vet visit request ${JSON.stringify(message.body)}`, error)
  }
}

module.exports = processVetVisit
