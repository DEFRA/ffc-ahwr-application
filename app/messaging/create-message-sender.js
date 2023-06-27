const { MessageSender } = require('ffc-messaging')

const cachedSenders = {}

const createMessageSender = (config) => {
  if (cachedSenders[config.address]) {
    return cachedSenders[config.address]
  }

  const sender = new MessageSender(config)
  cachedSenders[config.address] = sender

  return sender
}

const closeAllConnections = async () => {
  const senderKeys = Object.keys(cachedSenders)

  for (const key of senderKeys) {
    const sender = cachedSenders[key]
    await sender.closeConnection()
    delete cachedSenders[key]
  }
}

module.exports = {
  createMessageSender,
  closeAllConnections,
  cachedSenders
}
