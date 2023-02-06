const Joi = require('joi')
const Boom = require('@hapi/boom')
const { getLatestApplicationsBy } = require('../../repositories/application-repository')

module.exports = [
  {
    method: 'GET',
    path: '/api/applications/latest',
    options: {
      validate: {
        query: Joi.object({
          businessEmail: Joi
            .string()
            .trim()
            .lowercase()
            .required()
            .email()
        }),
        failAction (request, h, err) {
          throw Boom.badRequest('"businessEmail" query param must be provided')
        }
      },
      handler: async (request, h) => {
        try {
          const applications = await getLatestApplicationsBy(request.query.businessEmail)
          return h.response(applications).code(200)
        } catch (error) {
          console.error(`${new Date().toISOString()} Error while getting latest application for each SBI by ${JSON.stringify({
            businessEmail: request.query.businessEmail
          })}`, error)
          throw Boom.internal(error)
        }
      }
    }
  }
]
