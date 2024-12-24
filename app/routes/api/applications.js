import Joi from 'joi'
import { v4 as uuid } from 'uuid'
import { get, searchApplications, updateByReference } from '../../repositories/application-repository'
import { config } from '../../config'
import { sendMessage } from '../../messaging/send-message'
import { applicationStatus } from '../../constants/application-status'
import { processApplicationApi } from '../../messaging/application/process-application'
import { searchPayloadSchema } from './schema/search-payload.schema'

const { submitPaymentRequestMsgType, submitRequestQueue } = config

export const applicationHandlers = [{
  method: 'GET',
  path: '/api/application/get/{ref}',
  options: {
    validate: {
      params: Joi.object({
        ref: Joi.string().valid()
      })
    },
    handler: async (request, h) => {
      const application = await get(request.params.ref)
      if (application?.dataValues) {
        return h.response(application.dataValues).code(200)
      } else {
        return h.response('Not Found').code(404).takeover()
      }
    }
  }
}, {
  method: 'POST',
  path: '/api/application/search',
  options: {
    validate: {
      payload: Joi.object({
        ...searchPayloadSchema,
        sort: Joi.object({
          field: Joi.string().valid().optional().default('CREATEDAT'),
          direction: Joi.string().valid().optional().allow('ASC')
        }).optional(),
        filter: Joi.array().optional()
      }),
      failAction: async (request, h, err) => {
        request.logger.error({ err })
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { applications, total, applicationStatus } = await searchApplications(request.payload.search.text ?? '', request.payload.search.type, request.payload.filter, request.payload.offset, request.payload.limit, request.payload.sort)
      return h.response({ applications, total, applicationStatus }).code(200)
    }
  }
}, {
  method: 'PUT',
  path: '/api/application/{ref}',
  options: {
    validate: {
      params: Joi.object({
        ref: Joi.string().valid()
      }),
      payload: Joi.object({
        status: Joi.number().valid(2, 5),
        user: Joi.string()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { status } = request.payload
      request.logger.setBindings({ status })
      const application = (await get(request.params.ref))
      if (!application.dataValues) {
        return h.response('Not Found').code(404).takeover()
      }

      await updateByReference({ reference: request.params.ref, statusId: status, updatedBy: request.payload.user })

      return h.response().code(200)
    }
  }
},
{
  method: 'POST',
  path: '/api/application/processor',
  handler: async (request, h) => {
    try {
      request.logger.setBindings({ sbi: request.payload?.sbi })
      const appProcessed = await processApplicationApi(request.payload)
      return h.response(appProcessed).code(200)
    } catch (error) {
      request.logger.setBindings({ err: error })
      return h.response({ error }).code(400).takeover()
    }
  }
},
{
  method: 'POST',
  path: '/api/application/claim',
  options: {
    validate: {
      payload: Joi.object({
        approved: Joi.boolean().required(),
        reference: Joi.string().valid(),
        user: Joi.string().required()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { reference } = request.payload

      request.logger.setBindings({ reference })

      const application = await get(reference)

      if (!application.dataValues) {
        return h.response('Not Found').code(404).takeover()
      }

      try {
        let statusId = applicationStatus.rejected

        if (request.payload.approved) {
          statusId = applicationStatus.readyToPay

          await sendMessage(
            {
              reference,
              sbi: application.dataValues.data.organisation.sbi,
              whichReview: application.dataValues.data.whichReview
            }, submitPaymentRequestMsgType, submitRequestQueue, { sessionId: uuid() }
          )
        }

        request.logger.setBindings({ statusId })

        await updateByReference({ reference, statusId, updatedBy: request.payload.user })
      } catch (err) {
        request.logger.setBindings({ applicationUpdateError: err })
      }
      return h.response().code(200)
    }
  }
}]
