const { MessageReceiver, MessageSender } = require('ffc-messaging')
const config = require('../config')
const processApplicationMessage = require('./process-message')

let applicationReceiver

const start = async () => {
  const applicationAction = message => processApplicationMessage(message, applicationReceiver)
  applicationReceiver = new MessageReceiver(config.applicationRequestQueue, applicationAction)
  await applicationReceiver.subscribe()

  console.info('Ready to receive messages')
}

const stop = async () => {
  await applicationReceiver.closeConnection()
}

module.exports = { start, stop }
