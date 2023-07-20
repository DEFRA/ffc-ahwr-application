const queryEntitiesByPartitionKey = require('./query-entities')
const { odata } = require('@azure/data-tables')

const getApplicationHistory = async (reference) => {
  const historyRecords = await queryEntitiesByPartitionKey(
    'ffcahwrapplicationstatus',
    reference,
    // The partition key in the application status table is the application reference
    // so query where it's an exact match
    odata`PartitionKey eq ${reference}`
  )

  if (historyRecords.length === 0) { return null }
  return historyRecords
}

module.exports = { getApplicationHistory }
