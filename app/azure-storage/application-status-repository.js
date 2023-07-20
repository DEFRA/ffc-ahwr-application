const queryEntitiesByPartitionKey = require('./query-entities')
const { odata } = require('@azure/data-tables')

const getApplicationHistory = async (reference) => {
  const historyRecords = await queryEntitiesByPartitionKey(
    'ffcahwrapplicationstatus',
    reference,
    odata`PartitionKey eq ${reference}`
  )

  if (historyRecords.length === 0) { return null }
  return historyRecords
}

module.exports = { getApplicationHistory }
