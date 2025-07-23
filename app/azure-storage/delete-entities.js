import { createTableClient } from './create-table-client.js'

export const deleteEntitiesByPartitionKey = async (
  tableName,
  partitionKey,
  queryFilter
) => {
  const tableClient = createTableClient(tableName)
  const filter = queryFilter || `PartitionKey eq '${partitionKey}'`

  try {
    const entities = tableClient.listEntities({
      queryOptions: { filter }
    })

    const deletions = []
    for await (const entity of entities) {
      deletions.push(
        tableClient
          .deleteEntity(entity.partitionKey, entity.rowKey)
          .then(() =>
            console.log(`Deleted: PartitionKey=${entity.partitionKey}, RowKey=${entity.rowKey}`)
          )
          .catch((err) =>
            console.error(`Failed to delete entity ${entity.rowKey}:`, err)
          )
      )
    }

    await Promise.all(deletions)
    console.log(`Finished deleting entities with PartitionKey = '${partitionKey}'`)
  } catch (error) {
    console.error('Error during deletion:', error)
    throw error
  }
}
