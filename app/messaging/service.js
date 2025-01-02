import { MessageReceiver } from 'ffc-messaging'
import { closeAllConnections } from '../messaging/create-message-sender'
import { config } from '../config'
import { processApplicationMessage } from './process-message'

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
