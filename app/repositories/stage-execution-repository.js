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
  await eventPublisher.raise({
    message: 'New stage execution has been created',
    application: {
      id: result[1][0].dataValues.id,
      reference: result[1][0].dataValues.applicationReference,
      statusId: result[1][0].dataValues.action.action,
      data: {
        organisation: {
          sbi: 'n/a'
        }
      }
    },
    raisedBy: result[1][0].dataValues.executedBy,
    raisedOn: result[1][0].dataValues.executedAt
  })
  return result
}

module.exports = {
  getAll,
  getById,
  getByApplicationReference,
  set,
  update
}
