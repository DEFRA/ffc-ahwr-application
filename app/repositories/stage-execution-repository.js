const { models } = require('../data')
/**
 * Get stage execution by id
 * @param {integer} id
 * @returns stage execution object
 */
async function get (id) {
  return models.stage_execution.findAll(
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
  const result = await models.stage_execution.create(data)
  return result
}

module.exports = {
  get,
  set
}
