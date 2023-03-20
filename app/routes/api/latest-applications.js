const Joi = require('joi')
const Boom = require('@hapi/boom')
const { getLatestApplicationsByBusinessEmail, getLatestApplicationsBySbi } = require('../../repositories/application-repository')
const SBI_SCHEMA = require('../../schemas/sbi.schema.js')
const ERROR_MESSAGE = {
  enterSbiNumberThatHas9Digits: 'The SBI number must have 9 digits',
  sbiNumberOutOfRange: 'The single business identifier (SBI) number is not recognised'
}

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
            .optional()
            .email(),
          sbi: SBI_SCHEMA
        }).min(1).messages({
          'object.min': '"businessEmail" or "sbi" query param must be provided',
          'number.base': ERROR_MESSAGE.enterSbiNumberThatHas9Digits,
          'number.integer': ERROR_MESSAGE.enterSbiNumberThatHas9Digits,
          'number.less': ERROR_MESSAGE.enterSbiNumberThatHas9Digits,
          'number.greater': ERROR_MESSAGE.enterSbiNumberThatHas9Digits,
          'number.min': ERROR_MESSAGE.sbiNumberOutOfRange,
          'number.max': ERROR_MESSAGE.sbiNumberOutOfRange
        }),
        failAction (request, h, err) {
          throw Boom.badRequest(err.message)
        }
      },
      handler: async (request, h) => {
        try {
          const applications = request.query.businessEmail ? await getLatestApplicationsByBusinessEmail(request.query.businessEmail) : await getLatestApplicationsBySbi(request.query.sbi)
          return h.response(applications).code(200)
        } catch (error) {
          console.error(`${new Date().toISOString()} Error while getting latest applications by ${JSON.stringify({
            businessEmail: request.query.businessEmail
          })}`, error)
          throw Boom.internal(error)
        }
      }
    }
  }
]
