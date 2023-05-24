const { models } = require('../data')
const eventPublisher = require('../event-publisher')

/**
 * Get stage executions
 * @returns array of stage execution objects
 */
async function getAll () {
  return models.stage_execution.findAll()
}

/**
 * Get stage execution by id
 * @param {number} id
 * @returns stage execution object
 */
async function getById (id) {
  return models.stage_execution.findOne(
    {
      where: { id }
    })
}

/**
 * Get stage execution by application reference
 * @param {string} applicationReference
 * @returns stage execution array
 */
async function getByApplicationReference (applicationReference) {
  return models.stage_execution.findAll(
    {
      where: { applicationReference }
    })
}

/**
 *
 * @param {*} data
 * @returns
 */
async function set (data, sbi) {
  const result = await models.stage_execution.create(data)
  await eventPublisher.raise({
    message: 'New stage execution has been created',
    application: {
      id: result.dataValues.id,
      reference: result.dataValues.applicationReference,
      statusId: result.dataValues.action.action,
      data: {
        organisation: {
          sbi
        }
      }
    },
    raisedBy: result.dataValues.executedBy,
    raisedOn: result.dataValues.executedAt
  })
  return result
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
  getAll,
  getById,
  getByApplicationReference,
  set,
  update
}
