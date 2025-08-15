import joi from 'joi'
import { findClaim, updateClaimData } from '../../repositories/claim-repository.js'
import { StatusCodes } from 'http-status-codes'

export const claimsHandlers = [
  {
    method: 'put',
    path: '/api/claims/{reference}/data',
    options: {
      validate: {
        params: joi.object({
          reference: joi.string()
        }),
        payload: joi.object({
          vetsName: joi.string(),
          dateOfVisit: joi.string(),
          vetRCVSNumber: joi.string().pattern(/^\d{6}[\dX]$/i),
          note: joi.string().required(),
          user: joi.string().required()
        }).or('vetsName', 'dateOfVisit', 'vetRCVSNumber')
          .required(),
        failAction: async (request, h, err) => {
          request.logger.setBindings({ err })
          return h.response({ err }).code(StatusCodes.BAD_REQUEST).takeover()
        }
      }
    },
    handler: async (request, h) => {
      const { reference } = request.params
      const { note, user, ...dataPayload } = request.payload

      request.logger.setBindings({ reference, dataPayload })

      const claim = await findClaim(reference)
      if (claim === null) {
        return h.response('Not Found').code(StatusCodes.NOT_FOUND).takeover()
      }

      const [updatedProperty, newValue] = Object.entries(dataPayload)
        .filter(([key, value]) => value !== claim.data[key])
        .flat()

      if (updatedProperty === undefined && newValue === undefined) {
        return h.response().code(StatusCodes.NO_CONTENT)
      }

      const oldValue = claim.data[updatedProperty]

      await updateClaimData(reference, updatedProperty, newValue, oldValue, note, user)

      return h.response().code(StatusCodes.NO_CONTENT)
    }
  }
]
