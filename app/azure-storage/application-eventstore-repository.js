import { queryEntitiesByPartitionKey } from './query-entities.js'
import { odata } from '@azure/data-tables'

export const getApplicationEvents = async (sbi) => {
  const eventRecords = await queryEntitiesByPartitionKey(
    'ahwreventstore',
    sbi,
    // The partition key in the eventstore table can be either sbi or sbi_cph
    // so query where the partition key starts with the sbi
    odata`PartitionKey ge ${sbi} and PartitionKey lt ${(+sbi + 1).toString()}`
  )

  if (eventRecords.length === 0) { return null }
  return eventRecords
}
