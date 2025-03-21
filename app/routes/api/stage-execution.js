import Joi from 'joi'
import { getClaimByReference, updateClaimByReference } from '../../repositories/claim-repository.js'
import { applicationStatus } from '../../constants/index.js'
import { getApplication, updateApplicationByReference } from '../../repositories/application-repository.js'
import { getAll, set, getById, update, getByApplicationReference } from '../../repositories/stage-execution-repository.js'

export const stageExecutionHandlers = [{
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
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      let applicationOrClaim
      request.logger.setBindings({ payload: request.payload })

      if (request.payload.claimOrApplication === 'claim') {
        applicationOrClaim = await getClaimByReference(request.payload.applicationReference)
      }

      if (request.payload.claimOrApplication === 'application') {
        applicationOrClaim = await getApplication(request.payload.applicationReference)
      }

      if (!applicationOrClaim?.dataValues) {
        return h.response('Reference not found').code(400).takeover()
      }

      const response = await set(request.payload)

      request.logger.setBindings({ response })

      // Update status on basis of action
      let statusId = null

      switch (request.payload.action.action) {
        case 'Recommend to pay':
          statusId = applicationStatus.recommendToPay
          break
        case 'Recommend to reject':
          statusId = applicationStatus.recommendToReject
          break
        // To refactor this after MVP release
        case 'Ready to pay':
          statusId = applicationStatus.readyToPay
          break
        case 'Rejected':
          statusId = applicationStatus.rejected
          break
      }

      if (statusId) {
        if (request.payload.claimOrApplication === 'claim') {
          const mainApplication = await getApplication(applicationOrClaim.dataValues.applicationReference)
          const sbi = mainApplication?.dataValues?.data?.organisation?.sbi
          const note = null
          // note that even though it using request.payload.applicationReference
          // it can actually be the claim reference which is passed in the request
          // see AHWR-454 for further details
          await updateClaimByReference({ reference: request.payload.applicationReference, statusId, updatedBy: request.payload.executedBy, sbi }, note, request.logger)
        } else {
          await updateApplicationByReference({ reference: request.payload.applicationReference, statusId, updatedBy: request.payload.executedBy })
        }
      }

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
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { id } = request.params

      request.logger.setBindings({ stageExecutionId: id })
      const stageExecution = await getById(id)
      if (!stageExecution) {
        return h.response('Not Found').code(404).takeover()
      }

      const response = await update(request.params)

      return h.response(response).code(200)
    }
  }
}]
