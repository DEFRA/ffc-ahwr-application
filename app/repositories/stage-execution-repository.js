const { models } = require('../data')
const eventPublisher = require('../event-publisher')
const { get } = require('./application-repository')

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
  const result = await models.stage_execution.create(data)
  await eventPublisher.raise({
    message: 'New stage execution has been created',
    application: {
      id: result.dataValues.id,
      reference: result.dataValues.applicationReference,
      statusId: result.dataValues.action.action,
      data: {
        organisation: {
          sbi: await get(result.dataValues.applicationReference).then((application) => {
            return application.dataValues.data.organisation.sbi
          })
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
  for (let i = 0; i < result[0]; i++) {
    await eventPublisher.raise({
      message: 'Stage execution has been updated',
      application: {
        id: result[1][i].dataValues.id,
        reference: result[1][i].dataValues.applicationReference,
        statusId: result[1][i].dataValues.action.action,
        data: {
          organisation: {
            sbi: await get(result[1][i].dataValues.applicationReference).then((application) => {
              return application.dataValues.data.organisation.sbi
            })
          }
        }
      },
      raisedBy: result[1][i].dataValues.executedBy,
      raisedOn: result[1][i].dataValues.executedAt
    })
  }
  return result
}

module.exports = {
  getAll,
  getById,
  getByApplicationReference,
  set,
  update
}
