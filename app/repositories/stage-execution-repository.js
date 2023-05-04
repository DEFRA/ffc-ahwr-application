const { models } = require('../data')
/**
 * Get stage execution by id
 * @returns stage execution object
 */
async function get () {
  return models.stage_execution.findAll()
}

/**
 *
 * @param {*} data
 * @returns
 */
async function set (data) {
  return models.stage_execution.create(data)
}

/**
 * Update stage execution
 * @param {*} data - stage execution data
 * @returns stage execution object
 * @example
*/
async function update (data) {
  const result = await models.stage_execution.update(
    { processedAt: new Date() },
    {
      where: { id: data.id },
      returning: true
    }
  )
  return result
}

module.exports = {
  get,
  set,
  update
}
