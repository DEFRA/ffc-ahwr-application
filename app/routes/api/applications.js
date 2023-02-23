const Joi = require('joi')
const { v4: uuid } = require('uuid')
const { get, searchApplications, updateByReference } = require('../../repositories/application-repository')
const { submitPaymentRequestMsgType, submitRequestQueue } = require('../../config')
const sendMessage = require('../../messaging/send-message')
const statusIds = require('../../constants/application-status')
const { sendSessionEvent } = require('../../event')

function isUpdateSuccessful (res) {
  return res[0] === 1
}

const sendEvent = async (reference, entryKey, key) => {
  const updatedApplication = await get(reference)
  sendSessionEvent(updatedApplication.dataValues.data.organisation, uuid(), entryKey, key,
    { user: updatedApplication.updatedBy, updatedAt: updatedApplication.updatedAt })
}

module.exports = [{
  method: 'GET',
  path: '/api/application/get/{ref}',
  options: {
    validate: {
      params: Joi.object({
        ref: Joi.string().valid()
      })
    },
    handler: async (request, h) => {
      const application = (await get(request.params.ref))
      if (application.dataValues) {
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
        offset: Joi.number().default(0),
        limit: Joi.number().greater(0).default(20),
        search: Joi.object({
          text: Joi.string().valid().optional().allow(''),
          type: Joi.string().valid().optional().default('sbi')
        }).optional(),
        sort: Joi.object({
          field: Joi.string().valid().optional().default('CREATEDAT'),
          direction: Joi.string().valid().optional().allow('ASC')
        }).optional(),
        filter: Joi.array().optional()
      }),
      failAction: async (_request, h, err) => {
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
        status: Joi.number().valid(2),
        user: Joi.string()
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const application = (await get(request.params.ref))
      if (!application.dataValues) {
        return h.response('Not Found').code(404).takeover()
      }

      const res = await updateByReference({ reference: request.params.ref, statusId: request.payload.status, updatedBy: request.payload.user })

      const updateSuccess = isUpdateSuccessful(res)
      if (updateSuccess && application.statusId !== statusIds.withdrawn && request.payload.status === statusIds.withdrawn) {
        sendEvent(request.params.ref, 'application', 'withdrawn')
      }

      return h.response().code(200)
    }
  }
}, {
  method: 'POST',
  path: '/api/application/claim',
  options: {
    validate: {
      payload: Joi.object({
        approved: Joi.boolean().required(),
        reference: Joi.string().valid(),
        user: Joi.string().required()
      }),
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    handler: async (request, h) => {
      const application = (await get(request.payload.reference))
      if (!application.dataValues) {
        return h.response('Not Found').code(404).takeover()
      }

      try {
        let statusId = statusIds.rejected
        if (request.payload.approved) {
          statusId = statusIds.readyToPay

          await sendMessage(
            {
              reference: request.payload.reference,
              sbi: application.dataValues.data.organisation.sbi,
              whichReview: application.dataValues.data.whichReview
            }, submitPaymentRequestMsgType, submitRequestQueue, { sessionId: uuid() }
          )
        }

        const res = await updateByReference({ reference: request.payload.reference, statusId, updatedBy: request.payload.user })

        const updateSuccess = isUpdateSuccessful(res)
        if (updateSuccess && (application.statusId === statusIds.inCheck && (statusId === statusIds.readyToPay || statusId === statusIds.rejected))) {
          if (statusId === statusIds.readyToPay) {
            sendEvent(request.payload.reference, 'claim', 'approved')
          } else {
            sendEvent(request.payload.reference, 'claim', 'rejected')
          }
        }
        console.log(`Status of application with reference ${request.payload.reference} successfully updated`)
      } catch (error) {
        console.error(`Status of application with reference ${request.payload.reference} failed to update`)
      }

      return h.response().code(200)
    }
  }
}]
