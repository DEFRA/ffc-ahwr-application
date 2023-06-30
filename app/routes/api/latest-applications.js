const Joi = require('joi')
const Boom = require('@hapi/boom')
const { getLatestApplicationsBySbi } = require('../../repositories/application-repository')
const SBI_SCHEMA = require('./schema/sbi.schema.js')

const ERROR_MESSAGE = {
  mandatoryQueryParameters: '"sbi" query param must be provided',
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
          sbi: SBI_SCHEMA
        }).min(1).messages({
          'object.min': ERROR_MESSAGE.mandatoryQueryParameters,
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
          const applications = await getLatestApplicationsBySbi(request.query.sbi)
          return h.response(applications).code(200)
        } catch (error) {
          console.error(`${new Date().toISOString()} Error while getting latest applications by ${JSON.stringify({
            sbi: request.query.sbi
          })}`, error)
          throw Boom.internal(error)
        }
      }
    }
  }
]
