import joi from 'joi'
import { getClaim, patchClaimData } from '../../repositories/claim.js'

export const claimsHandlers = [
  {
    method: 'patch',
    path: '/api/claims/{reference}/data',
    options: {
      validate: {
        params: joi.object({
          reference: joi.string()
        }),
        payload: joi.object({
          vetsName: joi.string(),
          dateOfVisit: joi.date(),
          vetRCVSNumber: joi.string().pattern(/^\d{6}[\dX]$/i),
          note: joi.string().required()
        }).or('vetsName', 'dateOfVisit', 'vetRCVSNumber')
          .required(),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })
          return h.response({ err }).code(400).takeover()
        }
      }
    },
    handler: async (request, h) => {
      const { reference } = request.params
      const { note, ...dataPayload } = request.payload

      request.logger.setBindings({ reference, dataPayload })

      const claim = await getClaim(reference)
      if (claim === null) {
        return h.response('Not Found').code(404).takeover()
      }

      const [key, value] = Object.entries(dataPayload)
        .filter(([key, value]) => value !== claim.data[key])
        .flat()

      if (key === undefined && value === undefined) {
        return h.response().code(204)
      }

      await patchClaimData(reference, key, value, note)
      return h.response().code(204)
    }
  }
]
