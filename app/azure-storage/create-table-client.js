import { DefaultAzureCredential } from '@azure/identity'
import { TableClient } from '@azure/data-tables'
import { config } from '../config'

export const createTableClient = (tableName) => {
  if (config.storage.useConnectionString) {
    return TableClient.fromConnectionString(
      config.storage.connectionString,
      tableName,
      {
        allowInsecureConnection: true
      }
    )
  } else {
    return new TableClient(
      `https://${config.storage.storageAccount}.table.core.windows.net`,
      tableName,
      new DefaultAzureCredential()
    )
  }
}
