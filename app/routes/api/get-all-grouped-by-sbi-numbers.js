const Joi = require('joi')
const { getAllGroupedBySbiNumbers } = require('../../repositories/application-repository')

module.exports = [
  {
    method: 'GET',
    path: '/api/application/getAllGroupedBySbiNumbers',
    options: {
      validate: {
        options: {
          validate: {
            query: Joi.object({
              sbi: Joi
                .array()
                .single()
                .items(Joi.string())
            })
              .options({
                stripUnknown: true
              })
          }
        }
      },
      handler: async (request, h) => {
        const statuses = await getAllGroupedBySbiNumbers(request.query.sbi)
        return h
          .response(JSON.stringify(statuses, null, 2))
          .code(200)
      }
    }
  }
]
