const { MessageSender } = require('ffc-messaging')

const cachedSenders = {}

const createMessageSender = (config) => {
  if (cachedSenders[JSON.stringify(config)]) {
    return cachedSenders[JSON.stringify(config)]
  }

  const sender = new MessageSender(config)
  cachedSenders[JSON.stringify(config)] = sender

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
