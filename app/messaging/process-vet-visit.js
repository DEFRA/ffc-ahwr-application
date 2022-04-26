const util = require('util')
const { set } = require('../repositories/vet-visit-repository')
const { get } = require('../repositories/application-repository')
const sendMessage = require('../messaging/send-message')
const { vetVisitResponseMsgType, applicationResponseQueue, serviceUri } = require('../config')
const { notify: { templateIdVetApplicationComplete, templateIdFarmerApplicationClaim } } = require('../config')
const sendEmail = require('../lib/send-email')

const processVetVisit = async (message) => {
  try {
    const msgBody = message.body
    console.log('received process vet visit request', util.inspect(msgBody, false, null, true))
    const { reference, rcvs } = msgBody.signup
    const farmerApplication = await get(reference)

    // if no application or application already submitted return
    if (!farmerApplication || farmerApplication?.vetVisit?.dataValues) {
      return sendMessage(null, vetVisitResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
    }

    await set({
      applicationReference: reference,
      rcvs,
      data: JSON.stringify(msgBody),
      createdBy: 'admin',
      createdAt: new Date()
    })

    // Send Vet confirmation email.
    await sendEmail(
      templateIdVetApplicationComplete,
      msgBody.signup.email,
      { personalisation: { reference }, reference }
    )

    // Send farmer invitation email.
    const farmerData = JSON.parse(farmerApplication.data)
    await sendEmail(
      templateIdFarmerApplicationClaim,
      farmerData.email,
      { personalisation: { reference, claimStartUrl: `${serviceUri}/farmer-claim/login` }, reference }
    )
    await sendMessage(msgBody, vetVisitResponseMsgType, applicationResponseQueue, { sessionId: msgBody.sessionId })
  } catch (error) {
    console.error(`failed to process vet visit request ${JSON.stringify(message.body)}`, error)
  }
}

module.exports = processVetVisit
