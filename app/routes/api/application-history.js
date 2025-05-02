import Joi from 'joi'
import { getApplicationHistory } from '../../azure-storage/application-status-repository.js'
import {
  findAllClaimUpdateHistory,
  getClaimByReference
} from '../../repositories/claim-repository.js'
import { getFlagsForApplicationIncludingDeleted } from '../../repositories/flag-repository.js'

export const buildFlagEvents = (flags) => {
  const getText = (appliesToMh, state) => {
    const label = appliesToMh ? 'Multiple Herds' : 'non-Multiple Herds'

    return {
      eventType: `Agreement ${state} (${label})`,
      newValue: `${state === 'flagged' ? 'Flagged' : 'Unflagged'} (${label})`,
      oldValue: `${state === 'flagged' ? 'Unflagged' : 'Flagged'}`
    }
  }

  return flags.flatMap(({ dataValues }) => {
    const { appliesToMh } = dataValues

    if (!dataValues.deletedAt) {
      const { eventType, newValue, oldValue } = getText(appliesToMh, 'flagged')

      // Only 1 event needed, as flag was created but not deleted
      return [{
        eventType,
        updatedProperty: 'agreementFlag',
        newValue,
        oldValue,
        note: dataValues.note,
        updatedBy: dataValues.createdBy,
        updatedAt: dataValues.createdAt
      }]
    }

    const deleted = getText(appliesToMh, 'unflagged')
    const created = getText(appliesToMh, 'flagged')

    // 2 events needed, as flag was created and then deleted
    return [
      {
        eventType: deleted.eventType,
        updatedProperty: 'agreementFlag',
        newValue: deleted.newValue,
        oldValue: deleted.oldValue,
        note: dataValues.deletedNote,
        updatedBy: dataValues.deletedBy,
        updatedAt: dataValues.deletedAt
      },
      {
        eventType: created.eventType,
        updatedProperty: 'agreementFlag',
        newValue: created.newValue,
        oldValue: created.oldValue,
        note: dataValues.note,
        updatedBy: dataValues.createdBy,
        updatedAt: dataValues.createdAt
      }
    ]
  })
}

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
        const reference = request.params.ref
        const history = await getApplicationHistory(reference)
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

        const dataUpdates = await findAllClaimUpdateHistory(reference)

        const normalisedDataUpdates = dataUpdates.map(({ dataValues }) => ({
          eventType: dataValues.eventType,
          updatedProperty: dataValues.updatedProperty,
          newValue: dataValues.newValue,
          oldValue: dataValues.oldValue,
          note: dataValues.note,
          updatedBy: dataValues.createdBy,
          updatedAt: dataValues.createdAt
        }))

        const isOldWorldAgreementReference = reference.includes('AHWR')

        let oldWorldApplicationFlagHistory
        let claimApplicationFlagHistory

        if (isOldWorldAgreementReference) {
          const flags = await getFlagsForApplicationIncludingDeleted(reference)

          oldWorldApplicationFlagHistory = buildFlagEvents(flags)
        } else {
          const claim = await getClaimByReference(reference)
          const { applicationReference } = claim.dataValues

          const flags = await getFlagsForApplicationIncludingDeleted(
            applicationReference
          )

          claimApplicationFlagHistory = buildFlagEvents(flags)
        }

        const historyRecords = [
          ...normalisedHistoryRecords,
          ...normalisedDataUpdates,
          ...(isOldWorldAgreementReference ? oldWorldApplicationFlagHistory : claimApplicationFlagHistory)
        ].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))

        return h.response({ historyRecords }).code(200)
      }
    }
  }
]
