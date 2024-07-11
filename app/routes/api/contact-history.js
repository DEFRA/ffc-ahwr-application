const Joi = require('joi')
const { updateByReference } = require('../../repositories/application-repository')
const { getLatestApplicationsBySbi } = require('../../repositories/application-repository')
const contactHistoryRepository = require('../../repositories/contact-history-repository')

const SBI_SCHEMA = require('./schema/sbi.schema.js')

module.exports = [
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
        const history = await contactHistoryRepository.getAllByApplicationReference(request.params.ref)
        if (history.length) {
          return h.response(history).code(200)
        } else {
          return h.response('Not Found').code(404).takeover()
        }
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
          orgEmail: Joi.string(),
          email: Joi.string().required().lowercase().email({ tlds: false }),
          address: Joi.string(),
          sbi: SBI_SCHEMA
        }),
        failAction: async (_request, h, err) => {
          console.log(`Payload validation error ${err}`)
          return h.response({ err }).code(400).takeover()
        }
      },
      handler: async (request, h) => {
        const applications = await getLatestApplicationsBySbi(request.payload.sbi)
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
            await updateByReference({ reference: application.reference, contactHistory, data: dataCopy, updatedBy: request.payload.user }, false)
            contactHistory.forEach(async (contact) => {
              await contactHistoryRepository.set({
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
