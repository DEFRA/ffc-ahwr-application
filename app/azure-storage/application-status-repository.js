import { queryEntitiesByPartitionKey } from './query-entities.js'
import { odata } from '@azure/data-tables'
import { config } from '../config/index.js'
import { getHistoryByReference } from '../repositories/status-history-repository.js'

export const getApplicationHistory = async (reference) => {
  const { enabled: dbHistory } = config.storeHistoryInDb
  if (dbHistory) {
    // If the database history is enabled, fetch the history from the database.
    const history = await getHistoryByReference(reference)
    return history.map(item => ({
      Payload: JSON.stringify({
        ...item.dataValues
      }),
      ChangedBy: item.dataValues.createdBy,
      ChangedOn: item.dataValues.createdAt,
      EventType: 'status-updated'
    }))
  }

  return queryEntitiesByPartitionKey(
    'ffcahwrapplicationstatus',
    reference,
    // The partition key in the application status table is either
    // the application reference OR the claim reference.
    odata`PartitionKey eq ${reference}`
  )
}
