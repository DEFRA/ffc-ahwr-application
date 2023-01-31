const Joi = require('joi')
const Boom = require('@hapi/boom')
const { getAllGroupedBySbiNumbers } = require('../../repositories/application-repository')

module.exports = [
  {
    method: 'GET',
    path: '/api/application/getAllGroupedBySbiNumbers',
    options: {
      validate: {
        query: Joi.object({
          sbi: Joi
            .array()
            .min(1)
            .required()
            .single()
            .items(Joi.string().required())
        }).options({
          stripUnknown: true
        }),
        failAction (request, h, err) {
          throw Boom.badRequest('At least one query param "sbi" must be provided.')
        }
      },
      handler: async (request, h) => {
        try {
          const applications = await getAllGroupedBySbiNumbers(
            Array.isArray(request.query.sbi) ? request.query.sbi : [request.query.sbi]
          )
          return h
            .response(applications)
            .code(200)
        } catch (error) {
          console.error(`${new Date().toISOString()} Error while getting all applications grouped by SBI numbers: `, error)
          throw Boom.internal(error)
        }
      }
    }
  }
]
