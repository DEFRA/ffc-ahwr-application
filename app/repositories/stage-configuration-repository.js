const { models } = require('../data')
/**
 * Get stage configuration
 * @returns stage configuration object
 */
async function getAll () {
  console.log(`${new Date().toISOString()} Getting all stage configurations`)
  const response = models.stage_configuration.findAll()
  console.log(`${new Date().toISOString()} Got all stage configurations: ${JSON.stringify(response.result)}`)
  return response
}

/**
 * Get stage configuration by id
 * @param {number} id
 * @returns stage configuration object
 */
async function getById (id) {
  console.log(`${new Date().toISOString()} Getting stage configuration by id: ${id}`)
  const response = models.stage_configuration.findOne(
    {
      where: { id }
    })
  console.log(`${new Date().toISOString()} Got stage configuration by id: ${JSON.stringify(response.result)}`)
  return response
}

module.exports = {
  getAll,
  getById
}
