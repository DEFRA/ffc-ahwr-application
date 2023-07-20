const queryEntitiesByPartitionKey = require('./query-entities')
const { odata } = require('@azure/data-tables')

const getApplicationEvents = async (sbi) => {
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

module.exports = { getApplicationEvents }
