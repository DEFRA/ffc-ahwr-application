const queryEntitiesByPartitionKey = require('./query-entities')
const { odata } = require('@azure/data-tables')

const getApplicationEvents = async (reference) => {
  const eventRecords = await queryEntitiesByPartitionKey(
    'ahwreventstore',
    reference,
    odata`PartitionKey ge ${reference} and PartitionKey lt ${(+reference + 1).toString()}`
  )

  if (eventRecords.length === 0) { return null }
  return eventRecords
}

module.exports = { getApplicationEvents }
