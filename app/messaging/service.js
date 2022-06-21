const { MessageReceiver } = require('ffc-messaging')
const config = require('../config')
const processApplicationMessage = require('./process-message')
const processPaymentResponse = require('./payments/process-payment-response')

let applicationReceiver
let paymentReceiver

const start = async () => {
  const applicationAction = message => processApplicationMessage(message, applicationReceiver)
  applicationReceiver = new MessageReceiver(config.applicationRequestQueue, applicationAction)
  await applicationReceiver.subscribe()

  const paymentAction = message => processPaymentResponse(message, paymentReceiver)
  paymentReceiver = new MessageReceiver(config.paymentResponseSubscription, paymentAction)
  await paymentReceiver.subscribe()

  console.info('Ready to receive messages')
}

const stop = async () => {
  await applicationReceiver.closeConnection()
  await paymentReceiver.closeConnection()
}

module.exports = { start, stop }
