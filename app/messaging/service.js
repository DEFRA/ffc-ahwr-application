const { MessageReceiver } = require('ffc-messaging')
const config = require('../config')
const processApplicationMessage = require('./process-message')
const fetchApplication = require('./fetch-application')

let applicationReceiver

const start = async () => {
  const applicationAction = message => processApplicationMessage(message, applicationReceiver)
  applicationReceiver = new MessageReceiver(config.applicationRequestQueue, applicationAction)
  await applicationReceiver.subscribe()

  const fetchApplicationAction = message = fetchApplication(message, applicationReceiver)
  fetchApplicationReceiver = new MessageReceiver(config.fetchApplicationRequestQueue, fetchApplicationAction)
  await fetchApplicationReceiver.subscribe()

  console.info('Ready to receive messages')
}

const stop = async () => {
  await applicationReceiver.closeConnection()
}

module.exports = { start, stop }
