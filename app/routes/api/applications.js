import joi from 'joi'
import { v4 as uuid } from 'uuid'
import {
  getApplication,
  searchApplications,
  updateApplicationByReference,
  findApplication,
  updateApplicationData
} from '../../repositories/application-repository.js'
import {
  createFlag,
  getFlagByAppRef,
  getFlagsForApplication
} from '../../repositories/flag-repository.js'
import { config } from '../../config/index.js'
import { sendMessage } from '../../messaging/send-message.js'
import { applicationStatus as APPLICATION_STATUS } from '../../constants/index.js'
import { processApplicationApi } from '../../messaging/application/process-application.js'
import { searchPayloadSchema } from './schema/search-payload.schema.js'
import HttpStatus from 'http-status-codes'

const { submitPaymentRequestMsgType, submitRequestQueue } = config

export const applicationHandlers = [
  {
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
          return h.response(application.dataValues).code(HttpStatus.OK)
        } else {
          return h.response('Not Found').code(HttpStatus.NOT_FOUND).takeover()
        }
      }
    }
  },
  {
    method: 'post',
    path: '/api/application/search',
    options: {
      validate: {
        payload: joi.object({
          ...searchPayloadSchema,
          sort: joi.object({
            field: joi.string().valid().optional().default('CREATEDAT'),
            direction: joi.string().valid().optional().allow('ASC')
          })
            .optional(),
          filter: joi.array().optional()
        }),
        failAction: async (request, h, err) => {
          request.logger.error({ err })
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { applications, total, applicationStatus } =
          await searchApplications(
            request.payload.search?.text ?? '',
            request.payload.search?.type,
            request.payload.filter,
            request.payload.offset,
            request.payload.limit,
            request.payload.sort
          )

        return h
          .response({
            applications,
            total,
            applicationStatus
          })
          .code(HttpStatus.OK)
      }
    }
  },
  {
    method: 'put',
    path: '/api/application/{ref}',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string().valid()
        }),
        payload: joi.object({
          status: joi.number().valid(...Object.values(APPLICATION_STATUS)),
          user: joi.string(),
          note: joi.string()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { status, user, note } = request.payload
        const { ref } = request.params
        request.logger.setBindings({ status })
        const application = await getApplication(ref)
        if (!application.dataValues) {
          return h.response('Not Found').code(HttpStatus.NOT_FOUND).takeover()
        }

        await updateApplicationByReference({
          reference: ref,
          statusId: status,
          updatedBy: user,
          note
        })

        return h.response().code(HttpStatus.OK)
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
        return h.response(appProcessed).code(HttpStatus.OK)
      } catch (error) {
        request.logger.setBindings({ err: error })
        return h.response({ error }).code(HttpStatus.BAD_REQUEST).takeover()
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
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { note, reference } = request.payload

        request.logger.setBindings({ reference })

        const application = await getApplication(reference)

        if (!application.dataValues) {
          return h.response('Not Found').code(HttpStatus.NOT_FOUND).takeover()
        }

        try {
          let statusId = APPLICATION_STATUS.rejected

          if (request.payload.approved) {
            statusId = APPLICATION_STATUS.readyToPay

            await sendMessage(
              {
                reference,
                sbi: application.dataValues.data.organisation.sbi,
                whichReview: application.dataValues.data.whichReview
              },
              submitPaymentRequestMsgType,
              submitRequestQueue,
              { sessionId: uuid() }
            )
          }

          request.logger.setBindings({ statusId })

          await updateApplicationByReference({
            reference,
            statusId,
            updatedBy: request.payload.user,
            note
          })
        } catch (err) {
          request.logger.setBindings({ applicationUpdateError: err })
        }
        return h.response().code(HttpStatus.OK)
      }
    }
  },
  {
    method: 'put',
    path: '/api/applications/{reference}/data',
    options: {
      validate: {
        params: joi.object({
          reference: joi.string()
        }),
        payload: joi.object({
          vetName: joi.string(),
          visitDate: joi.string(),
          vetRcvs: joi.string().pattern(/^\d{6}[\dX]$/i),
          note: joi.string().required(),
          user: joi.string().required()
        })
          .or('vetName', 'visitDate', 'vetRcvs')
          .required(),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { reference } = request.params
        const { note, user, ...dataPayload } = request.payload

        request.logger.setBindings({ reference, dataPayload })

        const application = await findApplication(reference)
        if (application === null) {
          return h.response('Not Found').code(HttpStatus.NOT_FOUND).takeover()
        }

        const [updatedProperty, newValue] = Object.entries(dataPayload)
          .filter(([key, value]) => value !== application.data[key])
          .flat()

        if (updatedProperty === undefined && newValue === undefined) {
          return h.response().code(HttpStatus.NO_CONTENT)
        }

        const oldValue = application.data[updatedProperty] ?? ''

        await updateApplicationData(
          reference,
          updatedProperty,
          newValue,
          oldValue,
          note,
          user
        )

        return h.response().code(HttpStatus.NO_CONTENT)
      }
    }
  },
  {
    method: 'post',
    path: '/api/application/{ref}/flag',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string().valid()
        }),
        payload: joi.object({
          user: joi.string().required(),
          note: joi.string().required(),
          appliesToMh: joi.bool().required()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { user, note, appliesToMh } = request.payload
        const { ref } = request.params

        request.logger.setBindings({ appliesToMh, user, note, ref })

        const application = await findApplication(ref)

        if (application === null) {
          return h.response('Not Found').code(HttpStatus.NOT_FOUND).takeover()
        }

        const flag = await getFlagByAppRef(ref, appliesToMh)

        // If the flag already exists then we dont create anything
        if (flag) {
          return h.response().code(HttpStatus.NO_CONTENT)
        }

        const data = {
          applicationReference: ref,
          sbi: application.data.organisation.sbi,
          note,
          createdBy: user,
          appliesToMh
        }

        await createFlag(data)

        return h.response().code(HttpStatus.CREATED)
      }
    }
  },
  {
    method: 'get',
    path: '/api/application/{ref}/flag',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string().valid()
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })
          return h.response({ err }).code(HttpStatus.BAD_REQUEST).takeover()
        }
      },
      handler: async (request, h) => {
        const { ref } = request.params

        request.logger.setBindings({ ref })

        const flags = await getFlagsForApplication(ref)

        return h.response(flags).code(HttpStatus.OK)
      }
    }
  }
]
