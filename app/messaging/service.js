import { MessageReceiver } from 'ffc-messaging'
import { closeAllConnections } from '../messaging/create-message-sender.js'
import { config } from '../config/index.js'
import { processApplicationMessage } from './process-message.js'

let applicationReceiver

export const start = async () => {
  const applicationAction = message => processApplicationMessage(message, applicationReceiver)
  applicationReceiver = new MessageReceiver(config.applicationRequestQueue, applicationAction)
  await applicationReceiver.subscribe()

  console.info('Ready to receive messages')
}

export const stop = async () => {
  await applicationReceiver.closeConnection()
  await closeAllConnections()
}
