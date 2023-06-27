const memoize = require('fast-memoize')
const { MessageSender } = require('ffc-messaging')

const cachedSenders = {}

const createMessageSender = memoize((config) => new MessageSender(config), {
  cache: {
    create () {
      const store = cachedSenders
      return {
        has (key) { return (key in store) },
        get (key) { return store[key] },
        set (key, value) { store[key] = value }
      }
    }
  }
})

const closeAllConnections = async () => {
  for (const key of Object.keys(cachedSenders)) {
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
