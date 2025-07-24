import { createTableClient } from './create-table-client.js'

export const updateEntitiesByPartitionKey = async (
  tableName,
  partitionKey,
  queryFilter,
  entityReplacements
) => {
  const tableClient = createTableClient(tableName)
  const filter = queryFilter || `PartitionKey eq '${partitionKey}'`

  try {
    const entities = tableClient.listEntities({
      queryOptions: { filter }
    })

    const updates = []
    for await (const entity of entities) {
      let replacements

      // TODO 1067 improve
      if (entityReplacements?.Payload) {
        // check that all payload properties exist, if not don't update
        let payloadReplacements = { Payload: JSON.stringify({ ...JSON.parse(`${entity.Payload}`) }) }
        const existingPayloadKeys = Object.keys(JSON.parse(`${entity.Payload}`))
        const payloadKeysToUpdate = Object.keys(entityReplacements.Payload)

        if (payloadKeysToUpdate.every(key => existingPayloadKeys.includes(key))) {
          payloadReplacements = { Payload: JSON.stringify({ ...JSON.parse(`${entity.Payload}`), ...entityReplacements.Payload }) }
        }

        replacements = { ...entityReplacements, ...payloadReplacements }
      } else {
        replacements = entityReplacements
      }

      // only update if something to update
      if (replacements) {
        const entityUpdates = {
          partitionKey: entity.partitionKey,
          rowKey: entity.rowKey,
          ...replacements
        }

        updates.push(
          tableClient
            .updateEntity(entityUpdates, 'Merge')
            .then(() =>
              console.log(`Updated: PartitionKey=${entity.partitionKey}, RowKey=${entity.rowKey}`)
            )
            .catch((err) =>
              console.error(`Failed to update entity ${entity.rowKey}:`, err)
            )
        )
      }
    }

    await Promise.all(updates)
    console.log(`Finished updating entities with PartitionKey = '${partitionKey}'`)
  } catch (error) {
    console.error('Error during update:', error)
    throw error
  }
}
