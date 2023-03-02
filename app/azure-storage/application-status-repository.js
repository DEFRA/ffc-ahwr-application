const queryEntitiesByPartitionKey = require('./query-entities')

const getApplicationHistory = async (reference) => {
  let historyRecords = []

  historyRecords = await queryEntitiesByPartitionKey(
    'ffcahwrapplicationstatus',
    reference
  )

  return historyRecords
}

module.exports = { getApplicationHistory }
