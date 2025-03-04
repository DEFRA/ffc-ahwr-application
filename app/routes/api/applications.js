import joi from 'joi'
import { v4 as uuid } from 'uuid'
import { getApplication, searchApplications, updateApplicationByReference } from '../../repositories/application-repository.js'
import { config } from '../../config/index.js'
import { sendMessage } from '../../messaging/send-message.js'
import { applicationStatus } from '../../constants/index.js'
import { processApplicationApi } from '../../messaging/application/process-application.js'
import { searchPayloadSchema } from './schema/search-payload.schema.js'

const { submitPaymentRequestMsgType, submitRequestQueue } = config

export const applicationHandlers = [{
  method: 'get',
  path: '/api/application/get/{ref}',
  options: {
    validate: {
      params: joi.object({
        ref: joi.string().valid()
      })
    },
    handler: async (request, h) => {
      const application = await getApplication(request.params.ref)
      if (application?.dataValues) {
        return h.response(application.dataValues).code(200)
      } else {
        return h.response('Not Found').code(404).takeover()
      }
    }
  }
}, {
  method: 'post',
  path: '/api/application/search',
  options: {
    validate: {
      payload: joi.object({
        ...searchPayloadSchema,
        sort: joi.object({
          field: joi.string().valid().optional().default('CREATEDAT'),
          direction: joi.string().valid().optional().allow('ASC')
        }).optional(),
        filter: joi.array().optional()
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
  method: 'put',
  path: '/api/application/{ref}',
  options: {
    validate: {
      params: joi.object({
        ref: joi.string().valid()
      }),
      payload: joi.object({
        status: joi.number().valid(...Object.values(applicationStatus)),
        user: joi.string(),
        note: joi.string()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { status, user, note } = request.payload
      const { ref } = request.params
      request.logger.setBindings({ status })
      const application = await getApplication(ref)
      if (!application.dataValues) {
        return h.response('Not Found').code(404).takeover()
      }

      await updateApplicationByReference({ reference: ref, statusId: status, updatedBy: user, note })

      return h.response().code(200)
    }
  }
},
{
  method: 'post',
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
  method: 'post',
  path: '/api/application/claim',
  options: {
    validate: {
      payload: joi.object({
        approved: joi.boolean().required(),
        reference: joi.string().required(),
        user: joi.string().required(),
        note: joi.string()
      }),
      failAction: async (request, h, err) => {
        request.logger.setBindings({ err })
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const { note, reference } = request.payload

      request.logger.setBindings({ reference })

      const application = await getApplication(reference)

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

        await updateApplicationByReference({ reference, statusId, updatedBy: request.payload.user, note })
      } catch (err) {
        request.logger.setBindings({ applicationUpdateError: err })
      }
      return h.response().code(200)
    }
  }
}]
