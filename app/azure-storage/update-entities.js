import pLimit from 'p-limit'
import { createTableClient } from './create-table-client.js'

const UPDATE_ENTITY_CONCURRENCY_LIMIT = 20

const redactFields = (target, redactedValueByField) => {
  const recurse = (obj) => {
    for (const [key, value] of Object.entries(obj)) {
      if (key in redactedValueByField) {
        obj[key] = redactedValueByField[key]
      } else if (value && typeof value === 'object') { // NOSONAR
        recurse(value)
      }
    }
  }

  recurse(target)
  return target
}

const applyReplacements = (entity, entityReplacements) => {
  const replacements = { ...entityReplacements }

  if (entityReplacements?.Payload) {
    const payload = JSON.parse(`${entity.Payload}`)
    const redactedPayload = redactFields(payload, replacements.Payload)
    replacements.Payload = JSON.stringify(redactedPayload)
  }

  return replacements
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
  const limit = pLimit(UPDATE_ENTITY_CONCURRENCY_LIMIT)

  try {
    const entities = tableClient.listEntities({
      queryOptions: { filter }
    })

    const updates = []
    for await (const entity of entities) {
      const replacements = applyReplacements(entity, entityReplacements)

      // only update if something to update
      const entityUpdates = {
        partitionKey: entity.partitionKey,
        rowKey: entity.rowKey,
        ...replacements
      }

      updates.push(
        limit(() => tableClient
          .updateEntity(entityUpdates, 'Merge')
          .catch((err) =>
            logger.error(`Failed to update entity ${entity.rowKey}:`, err)
          )
        )
      )
    }

    await Promise.all(updates)
    logger.info(`Redacted ${updates.length} entities in '${tableName}' with PartitionKey = '${partitionKey}'`)
  } catch (error) {
    logger.error('Error during update:', error)
    throw error
  }
}

export const replaceEntitiesByPartitionKey = async (
  tableName,
  partitionKey,
  queryFilter,
  entityReplacements,
  newPartitionKey,
  logger
) => {
  const tableClient = createTableClient(tableName)
  const filter = queryFilter || `PartitionKey eq '${partitionKey}'`
  const limit = pLimit(UPDATE_ENTITY_CONCURRENCY_LIMIT)

  try {
    const entities = tableClient.listEntities({
      queryOptions: { filter }
    })

    const updates = []
    for await (const entity of entities) {
      const replacements = applyReplacements(entity, entityReplacements)

      const newEntity = {
        ...entity,
        ...replacements,
        partitionKey: newPartitionKey,
        rowKey: entity.rowKey.replace(/^[^_]*/, newPartitionKey)
      }

      updates.push(
        limit(async () => {
          try {
            await tableClient.createEntity(newEntity)
            await tableClient.deleteEntity(entity.partitionKey, entity.rowKey) // Delete old entity
          } catch (err) {
            logger.error(err, `Failed to replace entity ${entity.rowKey} in ${tableName}`)
          }
        })
      )
    }

    await Promise.all(updates)
    logger.info(`Redacted ${updates.length} entities in '${tableName}' with PartitionKey = '${partitionKey}'`)
  } catch (error) {
    logger.error('Error during update:', error)
    throw error
  }
}
