const { NotifyClient } = require('notifications-node-client')
const { notify: { apiKey } } = require('../config')

module.exports = new NotifyClient(apiKey)
