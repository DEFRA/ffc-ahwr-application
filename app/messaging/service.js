const { MessageReceiver } = require('ffc-messaging')
const config = require('../config')
const processApplicationMessage = require('./process-message')

let applicationReceiver

const start = async () => {
  try {
    const applicationAction = message => processApplicationMessage(message, applicationReceiver)
    applicationReceiver = new MessageReceiver(config.applicationRequestQueue, applicationAction)
    await applicationReceiver.subscribe()
  
    console.info('Ready to receive messages')
  } catch (error) {
    console.error(error)
  }
}

const stop = async () => {
  await applicationReceiver.closeConnection()
}

module.exports = { start, stop }
