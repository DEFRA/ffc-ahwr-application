const { models } = require('../data')
/**
 * Get stage execution by id
 * @param {integer} id
 * @returns stage execution object
 */
async function get (id) {
  return models.stage-execution.findAll(
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
  const result = await models.stage-execution.create(data)
  return result
}

module.exports = {
  get,
  set
}
