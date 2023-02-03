const Joi = require('joi')
const Boom = require('@hapi/boom')
const { getLatestGroupedBySbiNumbers } = require('../../repositories/application-repository')

module.exports = [
  {
    method: 'GET',
    path: '/api/application/getLatestByEmail/{email}',
    options: {
      validate: {
        params: Joi.object({
          email: Joi
            .string()
            .required()
            .email()
        }),
        failAction (request, h, err) {
          throw Boom.badRequest('At least one query param "email" must be provided.')
        }
      },
      handler: async (request, h) => {
        try {
          const applications = await getLatestGroupedBySbiNumbers(request.params.email)
          return h.response(applications).code(200)
        } catch (error) {
          console.error(`${new Date().toISOString()} Error while getting latest application grouped by SBI numbers: `, error)
          throw Boom.internal(error)
        }
      }
    }
  }
]
