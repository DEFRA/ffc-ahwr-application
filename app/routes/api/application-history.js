const Joi = require('joi')
const { getApplicationHistory } = require('../../azure-storage/application-status-repository')
const { getByApplicationReference } = require('../../repositories/stage-execution-repository')

module.exports = [
  {
    method: 'GET',
    path: '/api/application/history/{ref}',
    options: {
      validate: {
        params: Joi.object({
          ref: Joi.string().valid()
        })
      },
      handler: async (request, h) => {
        let applicationHistory = await getApplicationHistory(request.params.ref)
        applicationHistory = applicationHistory || []
        const stageExecutions = await getByApplicationReference(request.params.ref)
        const stageExecutionHistory = stageExecutions.map(stageExecution => ({
          Payload: {
            statusId: stageExecution.dataValues.action.action
          },
          ChangedOn: stageExecution.dataValues.executedAt,
          ChangedBy: stageExecution.dataValues.executedBy
        }))
        const history = JSON.stringify([...applicationHistory, ...stageExecutionHistory])
        return h.response(history).code(200)
      }
    }
  }
]
