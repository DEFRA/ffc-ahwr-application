const Joi = require('joi')
const Boom = require('@hapi/boom')
const { getAllGroupedBySbiNumbers } = require('../../repositories/application-repository')

module.exports = [
  {
    method: 'GET',
    path: '/api/application/getAllGroupedBySbiNumbers',
    options: {
      validate: {
        options: {
          validate: {
            query: Joi
              .object({
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
        try {
          const applications = await getAllGroupedBySbiNumbers(
            Array.isArray(request.query.sbi) ? request.query.sbi : [request.query.sbi]
          )
          return h
            .response(applications)
            .code(200)
        } catch (error) {
          console.error(`${new Date().toISOString()} Error while getting all applicatinos grouped by SBI numbers: `, error)
          throw Boom.internal(error)
        }
      }
    }
  }
]
