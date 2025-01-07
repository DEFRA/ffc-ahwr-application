import { MessageSender } from 'ffc-messaging'

export const cachedSenders = {}

export const createMessageSender = (config) => {
  if (cachedSenders[config.address]) {
    return cachedSenders[config.address]
  }

  const sender = new MessageSender(config)
  cachedSenders[config.address] = sender

  return sender
}

export const closeAllConnections = async () => {
  const senderKeys = Object.keys(cachedSenders)

  for (const key of senderKeys) {
    const sender = cachedSenders[key]
    await sender.closeConnection()
    delete cachedSenders[key]
  }
}
