const { MessageReceiver } = require('ffc-messaging')
const config = require('../config')
const processApplicationMessage = require('./process-message')
const processBackOfficeMessage = require('./process-backoffice-message')

let applicationReceiver, backOfficeReceiver

const start = async () => {
  const applicationAction = message => processApplicationMessage(message, applicationReceiver)
  applicationReceiver = new MessageReceiver(config.applicationRequestQueue, applicationAction)
  await applicationReceiver.subscribe()

  const backOfficeAction = message => processBackOfficeMessage(message, backOfficeReceiver)
  backOfficeReceiver = new MessageReceiver(config.backOfficeRequestQueue, backOfficeAction)
  await backOfficeReceiver.subscribe()

  console.info('Ready to receive messages')
}

const stop = async () => {
  await applicationReceiver.closeConnection()
  await backOfficeReceiver.closeConnection()
}

module.exports = { start, stop }
