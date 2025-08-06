import { createTableClient } from './create-table-client.js'

const redactFields = (target, redactedValueByField) => {
  const recurse = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (key in redactedValueByField) {
        obj[key] = redactedValueByField[key]
      } else if (value && typeof value === 'object') {
        recurse(value)
      }
    }
  }

  recurse(target)
  return target
}

export const updateEntitiesByPartitionKey = async (
  tableName,
  partitionKey,
  queryFilter,
  entityReplacements,
  logger
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

      if (entityReplacements?.Payload) {
        const payload = JSON.parse(`${entity.Payload}`)
        const redactedPayload = redactFields(payload, entityReplacements.Payload)

        replacements = { ...entityReplacements, Payload: JSON.stringify(redactedPayload) }
      } else {
        replacements = entityReplacements
      }

      // only update if something to update
      const entityUpdates = {
        partitionKey: entity.partitionKey,
        rowKey: entity.rowKey,
        ...replacements
      }

      updates.push(
        tableClient
          .updateEntity(entityUpdates, 'Merge')
          .then(() =>
            logger.info(`Updated: PartitionKey=${entity.partitionKey}, RowKey=${entity.rowKey}`)
          )
          .catch((err) =>
            logger.error(`Failed to update entity ${entity.rowKey}:`, err)
          )
      )
    }

    await Promise.all(updates)
    logger.info(`Finished updating entities with PartitionKey = '${partitionKey}'`)
  } catch (error) {
    logger.error('Error during update:', error)
    throw error
  }
}
