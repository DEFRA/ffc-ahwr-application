import { MessageReceiver } from 'ffc-messaging'
import { closeAllConnections } from '../messaging/create-message-sender.js'
import { config } from '../config/index.js'
import { processApplicationMessage } from './process-message.js'

let applicationReceiver

export const startMessagingService = async (logger) => {
  const applicationAction = message => processApplicationMessage(message, applicationReceiver, logger.child({}))
  applicationReceiver = new MessageReceiver(config.applicationRequestQueue, applicationAction)
  await applicationReceiver.subscribe()

  logger.info('Ready to receive messages')
}

export const stopMessagingService = async () => {
  await applicationReceiver.closeConnection()
  await closeAllConnections()
}
