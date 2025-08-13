import joi from 'joi'
import { getApplication } from '../../repositories/application-repository.js'
import { StatusCodes } from 'http-status-codes'

export const latestContactDetailsHandlers = [
  {
    method: 'GET',
    path: '/api/application/latest-contact-details/{ref}',
    options: {
      validate: {
        params: joi.object({
          ref: joi.string().required()
        })
      },
      handler: async (request, h) => {
        const application = await getApplication(request.params.ref)

        if (!application) {
          return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
        }

        const { name, orgEmail, farmerName, email } = application.dataValues.data.organisation
        const contactDetails = {
          name,
          orgEmail,
          farmerName,
          email
        }

        return h.response(contactDetails).code(StatusCodes.OK)
      }
    }
  }
]
