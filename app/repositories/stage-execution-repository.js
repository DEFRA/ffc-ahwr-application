const { models } = require('../data')
/**
 * Get stage executions
 * @returns array of stage execution objects
 */
async function getAll () {
  console.log(`${new Date().toISOString()} application:stage_execution Getting all stage executions`)
  const response = models.stage_execution.findAll()
  console.log(`${new Date().toISOString()} application:stage_execution Got all stage executions: ${JSON.stringify(response)}`)
  return response
}

/**
 * Get stage execution by id
 * @param {number} id
 * @returns stage execution object
 */
async function getById (id) {
  console.log(`${new Date().toISOString()} application:stage_execution Getting stage executions by id: ${id}`)
  const response = models.stage_execution.findOne(
    {
      where: { id }
    })
  console.log(`${new Date().toISOString()} application:stage_execution Getting stage executions by id: ${JSON.stringify(response)}`)
  return response
}

/**
 * Get stage execution by application reference
 * @param {string} applicationReference
 * @returns stage execution array
 */
async function getByApplicationReference (applicationReference) {
  console.log(`${new Date().toISOString()} application:stage_execution Getting stage executions by application reference: ${applicationReference}`)
  const response = models.stage_execution.findAll(
    {
      where: { applicationReference }
    })
  console.log(`${new Date().toISOString()} application:stage_execution Got stage executions by application reference: ${JSON.stringify(response)}`)
  return response
}

/**
 *
 * @param {*} data
 * @returns
 */
async function set (data) {
  console.log(`${new Date().toISOString()} application:stage_execution Creating stage execution: ${JSON.stringify(data)}`)
  const response = models.stage_execution.create(data)
  console.log(`${new Date().toISOString()} application:stage_execution Created stage execution: ${JSON.stringify(response)}`)
  return response
}

/**
 * Update stage execution
 * @param {*} data - stage execution data
 * @returns stage execution object
 * @example
*/
async function update (data) {
  console.log(`${new Date().toISOString()} application:stage_execution Updating stage execution: ${JSON.stringify(data)}`)
  const result = await models.stage_execution.update(
    { processedAt: new Date() },
    {
      where: { id: data.id },
      returning: true
    }
  )
  console.log(`${new Date().toISOString()} application:stage_execution Updated stage execution: ${JSON.stringify(result)}`)
  return result
}

module.exports = {
  getAll,
  getById,
  getByApplicationReference,
  set,
  update
}
