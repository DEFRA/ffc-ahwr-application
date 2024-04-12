const Joi = require('joi')
const { updateByReference } = require('../../repositories/application-repository')
const { getLatestApplicationsBySbi } = require('../../repositories/application-repository')
const contactHistoryRepository = require('../../repositories/contact-history-repository')

const SBI_SCHEMA = require('./schema/sbi.schema.js')

module.exports = [{
  method: 'PUT',
  path: '/api/application/contact-history',
  options: {
    validate: {
      payload: Joi.object({
        user: Joi.string(),
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
      console.log('%%%%%%%%%%%%%%personSummary', JSON.stringify(applications))
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

        if (request.payload.address !== dataCopy.organisation.address) {
          contactHistory.push({
            field: 'address',
            oldValue: dataCopy.organisation.address,
            newValue: request.payload.address
          })
          dataCopy.organisation.address = request.payload.address
        }
        console.log('****************contactHistory', dataCopy.organisation)

        if (contactHistory.length > 0) {
          await updateByReference({ reference: application.reference, contactHistory, data: dataCopy, updatedBy: request.payload.user })
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
        console.log(`Status of application with reference ${application.reference} successfully updated to ${request.payload.status}`)
      })
      return h.response().code(200)
    }
  }
}]
