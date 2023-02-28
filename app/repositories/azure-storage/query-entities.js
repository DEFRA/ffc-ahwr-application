const { odata } = require('@azure/data-tables')
const createTableClient = require('../azure-storage/create-table-client')

const queryEntitiesByPartitionKey = async (tableName, partitionKey) => {
  const events = []
  if (tableName && partitionKey) {
    const tableClient = createTableClient(tableName)
    await tableClient.createTable(tableName)
    const eventResults = tableClient.listEntities(
      {
        queryOptions: {
          filter: odata`PartitionKey eq ${partitionKey}`
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
