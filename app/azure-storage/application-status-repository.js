import { queryEntitiesByPartitionKey } from './query-entities.js'
import { odata } from '@azure/data-tables'

export const getApplicationHistory = async (reference) => {
  return await queryEntitiesByPartitionKey(
    'ffcahwrapplicationstatus',
    reference,
    // The partition key in the application status table is the application reference
    // so query where it's an exact match
    odata`PartitionKey eq ${reference}`
  )
}
