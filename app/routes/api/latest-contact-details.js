import Joi from 'joi'
import { getApplication } from '../../repositories/application-repository.js'

export const latestContactDetailsHandlers = [
  {
    method: 'GET',
    path: '/api/application/latest-contact-details/{ref}',
    options: {
      validate: {
        params: Joi.object({
          ref: Joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const application = await getApplication(request.params.ref)
        if (!application) {
          return h.response('Not Found').code(404).takeover()
        }

        const organisation = application.dataValues.data.organisation
        const response = {
          name: organisation.name,
          orgEmail: organisation.orgEmail,
          farmerName: organisation.farmerName,
          email: organisation.email
        }

        return h.response(response).code(200)
      }
    }
  }
]
