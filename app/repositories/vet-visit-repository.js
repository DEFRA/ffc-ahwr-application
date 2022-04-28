const { models } = require('../data')

async function set (data) {
  return models.vetVisit.create(data)
}

module.exports = { set }
