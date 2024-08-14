const Joi = require('joi')
const { v4: uuid } = require('uuid')
const {
  get,
  searchApplications,
  updateByReference,
  getAllRecordsByCrn
} = require('../../repositories/application-repository')
const {
  submitPaymentRequestMsgType,
  submitRequestQueue
} = require('../../config')
const sendMessage = require('../../messaging/send-message')
const statusIds = require('../../constants/application-status')
const {
  processApplicationApi
} = require('../../messaging/application/process-application')
const { searchPayloadValidations } = require('./helpers')

module.exports = [
  {
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
        if (application.dataValues) {
          return h.response(application.dataValues).code(200)
        } else {
          return h.response('Not Found').code(404).takeover()
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/api/application/search',
    options: {
      validate: {
        payload: Joi.object({
          ...searchPayloadValidations(),
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
        const { applications, total, applicationStatus } =
          await searchApplications(
            request.payload.search.text ?? '',
            request.payload.search.type,
            request.payload.filter,
            request.payload.offset,
            request.payload.limit,
            request.payload.sort
          )
        return h.response({ applications, total, applicationStatus }).code(200)
      }
    }
  },
  {
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
        failAction: async (_request, h, err) => {
          console.log(`Payload validation error ${err}`)
          return h.response({ err }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const application = await get(request.params.ref)
        if (!application.dataValues) {
          return h.response('Not Found').code(404).takeover()
        }

        await updateByReference({
          reference: request.params.ref,
          statusId: request.payload.status,
          updatedBy: request.payload.user
        })
        console.log(
          `Status of application with reference ${request.params.ref} successfully updated to ${request.payload.status}`
        )
        return h.response().code(200)
      }
    }
  },
  {
    method: 'POST',
    path: '/api/application/processor',
    handler: async (request, h) => {
      try {
        const appData = request.payload
        const appProcessed = await processApplicationApi(appData)
        return h.response(appProcessed).code(200)
      } catch (error) {
        console.error(`Failed to process application : ${error}`)
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
        failAction: async (_request, h, err) => {
          return h.response({ err }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const application = await get(request.payload.reference)
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
              },
              submitPaymentRequestMsgType,
              submitRequestQueue,
              { sessionId: uuid() }
            )
          }

          await updateByReference({
            reference: request.payload.reference,
            statusId,
            updatedBy: request.payload.user
          })
          console.log(
            `Status of application with reference ${request.payload.reference} successfully updated`
          )
        } catch (error) {
          console.error(
            `Status of application with reference ${request.payload.reference} failed to update`
          )
        }
        return h.response().code(200)
      }
    }
  },
  {
    method: 'GET',
    path: '/api/application/{crn}',
    options: {
      validate: {
        params: Joi.object({
          crn: Joi.string().valid()
        }),
        failAction: async (_request, h, err) => {
          return h.response({ err }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        try {
          const application = await getAllRecordsByCrn(request.params.crn)
          if (application) {
            return h.response(application).code(200)
          } else {
            return h.response('Not Found').code(404).takeover()
          }
        } catch (err) {
          return h.response({ error: err.message }).code(400).takeover()
        }
      }
    }
  }
]
