const Joi = require('joi')
const { getApplicationHistory } = require('../../azure-storage/application-status-repository')

module.exports = [
  {
    method: 'GET',
    path: '/api/application/history/{ref}',
    options: {
      validate: {
        params: Joi.object({
          ref: Joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const historyRecords = await getApplicationHistory(request.params.ref)

        if (historyRecords) {
          return h.response({ historyRecords }).code(200)
        } else {
          return h.response('Not Found').code(404).takeover()
        }
      }
    }
  }
]
