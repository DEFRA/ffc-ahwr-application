import Joi from 'joi'
import Boom from '@hapi/boom'
import { getLatestApplicationsBySbi } from '../../repositories/application-repository.js'
import { sbiSchema } from './schema/sbi.schema.js'

const ERROR_MESSAGE = {
  mandatoryQueryParameters: '"sbi" query param must be provided',
  enterSbiNumberThatHas9Digits: 'The SBI number must have 9 digits',
  sbiNumberOutOfRange: 'The single business identifier (SBI) number is not recognised'
}

export const latestApplicationsHandlers = [
  {
    method: 'GET',
    path: '/api/applications/latest',
    options: {
      validate: {
        query: Joi.object({
          sbi: sbiSchema
        }).min(1).messages({
          'object.min': ERROR_MESSAGE.mandatoryQueryParameters,
          'number.base': ERROR_MESSAGE.enterSbiNumberThatHas9Digits,
          'number.integer': ERROR_MESSAGE.enterSbiNumberThatHas9Digits,
          'number.less': ERROR_MESSAGE.enterSbiNumberThatHas9Digits,
          'number.greater': ERROR_MESSAGE.enterSbiNumberThatHas9Digits,
          'number.min': ERROR_MESSAGE.sbiNumberOutOfRange,
          'number.max': ERROR_MESSAGE.sbiNumberOutOfRange
        }),
        failAction (_request, _h, err) {
          throw Boom.badRequest(err.message)
        }
      },
      handler: async (request, h) => {
        const { sbi } = request.query
        request.logger.setBindings({ sbi })
        try {
          const applications = await getLatestApplicationsBySbi(sbi)
          return h.response(applications).code(200)
        } catch (error) {
          throw Boom.internal(error)
        }
      }
    }
  }
]
