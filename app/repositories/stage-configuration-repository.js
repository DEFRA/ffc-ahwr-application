const { models } = require('../data')
/**
 * Get stage configuration
 * @returns stage configuration object
 */
async function getAll () {
  return models.stage_configuration.findAll()
}

module.exports = {
  getAll
}
