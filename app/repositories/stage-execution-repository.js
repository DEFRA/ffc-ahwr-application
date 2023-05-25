const { models } = require('../data')
const eventPublisher = require('../event-publisher')
const stageExecutionActions = require('../constants/application-stage-execution-actions')
const applicationStatus = require('../constants/application-status')
const { app } = require('../server')

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
  const status = getStatusId(result.dataValues.action.action)
  await eventPublisher.raise({
    message: 'New stage execution has been created',
    application: {
      id: result.dataValues.id,
      reference: result.dataValues.applicationReference,
      statusId: status.statusId,
      subStatus: status.subStatus,
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

const getStatusId = (status) => {
  switch (status) {
    case stageExecutionActions.recommendToPay:
      return {
        statusId: applicationStatus.inCheck,
        subStatus: stageExecutionActions.recommendToPay
      }
    case stageExecutionActions.recommendToReject:
      return {
        statusId: applicationStatus.inCheck,
        subStatus: stageExecutionActions.recommendToReject
      }
    case stageExecutionActions.authorisePayment:
      return {
        statusId: applicationStatus.readyToPay,
        subStatus: 'Authorise to pay'
      }
    case stageExecutionActions.authoriseRejection:
      return {
        statusId: applicationStatus.rejected,
        subStatus: 'Authorise to reject'
      }
    default:
      return ''
  }
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
