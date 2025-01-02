import Joi from 'joi'
import { updateApplicationByReference, getLatestApplicationsBySbi } from '../../repositories/application-repository'
import { getAllByApplicationReference, set } from '../../repositories/contact-history-repository'
import { sbiSchema } from './schema/sbi.schema.js'

export const contactHistoryHandlers = [
  {
    method: 'GET',
    path: '/api/application/contact-history/{ref}',
    options: {
      validate: {
        params: Joi.object({
          ref: Joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const history = await getAllByApplicationReference(request.params.ref)

        return h.response(history).code(200)
      }
    }
  },
  {
    method: 'PUT',
    path: '/api/application/contact-history',
    options: {
      validate: {
        payload: Joi.object({
          user: Joi.string(),
          farmerName: Joi.string(),
          orgEmail: Joi.string().allow(null),
          email: Joi.string().required().lowercase().email({ tlds: false }),
          address: Joi.string(),
          sbi: sbiSchema
        }),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err, sbi: request.payload.sbi })
          return h.response({ err }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const { sbi } = request.payload
        request.logger.setBindings({ sbi })

        const applications = await getLatestApplicationsBySbi(sbi)
        if (!applications.length) {
          return h.response('No applications found to update').code(200).takeover()
        }
        applications.forEach(async (application) => {
          const contactHistory = []
          const dataCopy = { ...application.data }
          if (request.payload.email !== dataCopy.organisation.email) {
            contactHistory.push({
              field: 'email',
              oldValue: dataCopy.organisation.email,
              newValue: request.payload.email
            })
            dataCopy.organisation.email = request.payload.email
          }

          if (request.payload.orgEmail !== dataCopy.organisation?.orgEmail) {
            contactHistory.push({
              field: 'orgEmail',
              oldValue: dataCopy.organisation?.orgEmail,
              newValue: request.payload.orgEmail
            })
            dataCopy.organisation.orgEmail = request.payload.orgEmail
          }

          if (request.payload.address !== dataCopy.organisation.address) {
            contactHistory.push({
              field: 'address',
              oldValue: dataCopy.organisation.address,
              newValue: request.payload.address
            })
            dataCopy.organisation.address = request.payload.address
          }

          if (request.payload.farmerName !== dataCopy.organisation.farmerName) {
            contactHistory.push({
              field: 'farmerName',
              oldValue: dataCopy.organisation.farmerName,
              newValue: request.payload.farmerName
            })
            dataCopy.organisation.farmerName = request.payload.farmerName
          }

          if (contactHistory.length > 0) {
            await updateApplicationByReference({ reference: application.reference, contactHistory, data: dataCopy, updatedBy: request.payload.user }, false)
            contactHistory.forEach(async (contact) => {
              await set({
                applicationReference: application.reference,
                sbi: request.payload.sbi,
                data: contact,
                createdBy: 'admin',
                createdAt: new Date()
              })
            })
          }
        })
        return h.response().code(200)
      }
    }
  }
]
