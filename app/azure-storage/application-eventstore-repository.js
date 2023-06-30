const queryEntitiesByPartitionKey = require('./query-entities')

const getApplicationEvents = async (reference) => {
  const eventRecords = await queryEntitiesByPartitionKey(
    'ahwreventstore',
    reference
  )

  if (eventRecords.length === 0) { return null }
  return eventRecords
}

module.exports = { getApplicationEvents }
