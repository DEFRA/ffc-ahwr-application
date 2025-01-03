import { createTableClient } from './create-table-client.js'

export const queryEntitiesByPartitionKey = async (tableName, partitionKey, queryFilter) => {
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

    console.log(eventResults)
    for await (const event of eventResults) {
      events.push(event)
    }
  }

  return events
}
