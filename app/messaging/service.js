const { MessageReceiver } = require('ffc-messaging')
const { closeAllConnections } = require('../messaging/create-message-sender')
const config = require('../config')
const processApplicationMessage = require('./process-message')

let applicationReceiver

const start = async () => {
  const applicationAction = message => applicationReceiver.deadLetterMessage(message)
  applicationReceiver = new MessageReceiver(config.applicationRequestQueue, applicationAction)
  await applicationReceiver.subscribe()

  console.info('Ready to receive messages')
}

const stop = async () => {
  await applicationReceiver.closeConnection()
  await closeAllConnections()
}

module.exports = { start, stop }
