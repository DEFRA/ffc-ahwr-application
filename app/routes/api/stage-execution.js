const Joi = require('joi')
const claim = require('../../repositories/claim-repository')
const { get, updateByReference } = require('../../repositories/application-repository')
const { getAll, set, getById, update, getByApplicationReference } = require('../../repositories/stage-execution-repository')
const statusIds = require('../../constants/application-status')

module.exports = [{
  method: 'GET',
  path: '/api/stageexecution',
  options: {
    handler: async (request, h) => {
      const stageExecution = await getAll()
      if (stageExecution) {
        return h.response(stageExecution).code(200)
      } else {
        return h.response('Not Found').code(404).takeover()
      }
    }
  }
}, {
  method: 'GET',
  path: '/api/stageexecution/{applicationReference}',
  options: {
    handler: async (request, h) => {
      const stageExecutions = await getByApplicationReference(request.params.applicationReference)
      if (stageExecutions) {
        return h.response(stageExecutions).code(200)
      } else {
        return h.response('Not Found').code(404).takeover()
      }
    }
  }
}, {
  method: 'POST',
  path: '/api/stageexecution',
  options: {
    validate: {
      payload: Joi.object({
        claimOrApplication: Joi.string().valid('application', 'claim').required(),
        applicationReference: Joi.string().required(),
        stageConfigurationId: Joi.number().greater(0).required(),
        executedAt: Joi.date().default(new Date()),
        executedBy: Joi.string().required(),
        processedAt: Joi.date().allow(null).optional(),
        action: Joi.object({
          action: Joi.string().required()
        }).allow(null).optional()
      }),
      failAction: async (_request, h, err) => {
        console.log(JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'error',
          message: 'Error when validating payload',
          context: {
            errorMessage: err.message,
            payload: _request.payload
          }
        }))
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      let application

      if (request.payload.claimOrApplication === 'claim') {
        application = await claim.getByReference(request.payload.applicationReference)
      }

      if (request.payload.claimOrApplication === 'application') {
        application = await get(request.payload.applicationReference)
      }

      if (!application.dataValues) {
        return h.response('Reference not found').code(400).takeover()
      }

      const response = await set(
        request.payload,
        application
      )

      // Update status on basis of action
      let statusId = null

      switch (request.payload.action.action) {
        case 'Recommend to pay':
          statusId = statusIds.recommendToPay
          break
        case 'Recommend to reject':
          statusId = statusIds.recommendToReject
          break
        case 'Paid':
          statusId = statusIds.paid
          break
        case 'Rejected':
          statusId = statusIds.rejected
          break
      }

      if (statusId) {
        if (request.payload.claimOrApplication === 'claim') {
          await claim.updateByReference({ reference: request.payload.applicationReference, statusId, updatedBy: request.payload.executedBy })
        } else {
          await updateByReference({ reference: request.payload.applicationReference, statusId, updatedBy: request.payload.executedBy })
        }
      }
      console.log('Stage execution inserted: ', response.dataValues)
      return h.response(response).code(200)
    }
  }
}, {
  method: 'PUT',
  path: '/api/stageexecution/{id}',
  options: {
    validate: {
      params: Joi.object({
        id: Joi.number().greater(0).required()
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const stageExecution = await getById(request.params.id)
      if (!stageExecution) {
        return h.response('Not Found').code(404).takeover()
      }

      const response = await update(request.params)

      return h.response(response).code(200)
    }
  }
}]
