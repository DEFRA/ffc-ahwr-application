const { models } = require('../data')
/**
 * Get stage configuration by id
 * @param {integer} id
 * @returns stage configuration object
 */
async function get (id) {
  return models.stage_configuration.findAll(
    {
      where: { id }
    })
}

/**
 *
 * @param {*} data
 * @returns
 */
async function set (data) {
  const result = await models.stage_configuration.create(data)
  return result
}

module.exports = {
  get,
  set
}
