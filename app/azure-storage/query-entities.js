const createTableClient = require('./create-table-client')

const queryEntitiesByPartitionKey = async (tableName, partitionKey, queryFilter) => {
  const events = []
  if (tableName && partitionKey) {
    const tableClient = createTableClient(tableName)
    await tableClient.createTable(tableName)
    const eventResults = tableClient.listEntities(
      {
        queryOptions: {
          filter: queryFilter
        }
      }
    )
    for await (const event of eventResults) {
      events.push(event)
    }
  }

  return events
}

module.exports = queryEntitiesByPartitionKey
