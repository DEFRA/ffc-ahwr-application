const { odata } = require('@azure/data-tables')
const createTableClient = require('./create-table-client')

const queryEntitiesByPartitionKey = async (tableName, partitionKey) => {
  const events = []
  if (tableName && partitionKey) {
    const tableClient = createTableClient(tableName)
    await tableClient.createTable(tableName)
    const eventResults = tableClient.listEntities(
      {
        queryOptions: {
          // filter those that start with the partitionKey
          filter: odata`PartitionKey ge ${partitionKey} and PartitionKey lt ${(+partitionKey + 1).toString()}`
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
