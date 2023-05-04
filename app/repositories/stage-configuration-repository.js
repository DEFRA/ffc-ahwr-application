const { models } = require('../data')
/**
 * Get stage configuration by id
 * @returns stage configuration object
 */
async function get () {
  return models.stage_configuration.findAll()
}

module.exports = {
  get
}
