const { models } = require('../data')
/**
 * Get stage configuration
 * @returns stage configuration object
 */
async function getAll () {
  return models.stage_configuration.findAll()
}

/**
 * Get stage configuration by id
 * @param {number} id
 * @returns stage configuration object
 */
async function getById (id) {
  return models.stage_configuration.findOne(
    {
      where: { id }
    })
}

module.exports = {
  getAll,
  getById
}
