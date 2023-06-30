const Joi = require('joi')
const { getApplicationEvents } = require('../../azure-storage/application-eventstore-repository')

module.exports = [
  {
    method: 'GET',
    path: '/api/application/events/{ref}',
    options: {
      validate: {
        params: Joi.object({
          ref: Joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const eventRecords = await getApplicationEvents(request.params.ref)
        return h.response({ eventRecords }).code(200)
      }
    }
  }
]
