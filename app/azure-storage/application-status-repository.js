const queryEntitiesByPartitionKey = require('./query-entities')

const getApplicationHistory = async (reference) => {
  const historyRecords = await queryEntitiesByPartitionKey(
    'ffcahwrapplicationstatus',
    reference
  )

  if (historyRecords.length === 0) { return null }
  return historyRecords
}

module.exports = { getApplicationHistory }
