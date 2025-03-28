import Joi from 'joi'
import { getApplicationHistory } from '../../azure-storage/application-status-repository.js'
import { findAllClaimUpdateHistory } from '../../repositories/claim-repository.js'

export const applicationHistoryHandlers = [
  {
    method: 'GET',
    path: '/api/application/history/{ref}',
    options: {
      validate: {
        params: Joi.object({
          ref: Joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const history = await getApplicationHistory(request.params.ref)
        const normalisedHistoryRecords = history.map((record) => {
          const { statusId, note } = JSON.parse(record.Payload)

          return {
            eventType: record.EventType,
            updatedProperty: 'statusId',
            newValue: statusId,
            note,
            updatedBy: record.ChangedBy,
            updatedAt: record.ChangedOn
          }
        })

        const dataUpdates = await findAllClaimUpdateHistory(request.params.ref)

        const normalisedDataUpdates = dataUpdates.map(({ dataValues }) => ({
          eventType: dataValues.eventType,
          updatedProperty: dataValues.updatedProperty,
          newValue: dataValues.newValue,
          oldValue: dataValues.oldValue,
          note: dataValues.note,
          updatedBy: dataValues.createdBy,
          updatedAt: dataValues.createdAt
        }))

        const historyRecords = [...normalisedHistoryRecords, ...normalisedDataUpdates]
          .sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))

        return h.response({ historyRecords }).code(200)
      }
    }
  }
]
