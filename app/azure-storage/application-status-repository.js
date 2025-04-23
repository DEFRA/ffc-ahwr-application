import { queryEntitiesByPartitionKey } from './query-entities.js'
import { odata } from '@azure/data-tables'

export const getApplicationHistory = async (reference) => {
  return queryEntitiesByPartitionKey(
    'ffcahwrapplicationstatus',
    reference,
    // The partition key in the application status table is either
    // the application reference OR the claim reference.
    odata`PartitionKey eq ${reference}`
  )
}
