const { DefaultAzureCredential } = require('@azure/identity')
const { TableClient } = require('@azure/data-tables')
const { storage: { connectionString, useConnectionString, storageAccount } } = require('../config')

const createTableClient = (tableName) => {
  if (useConnectionString) {
    return TableClient.fromConnectionString(
      connectionString,
      tableName,
      {
        allowInsecureConnection: true
      }
    )
  } else {
    return new TableClient(
      `https://${storageAccount}.table.core.windows.net`,
      tableName,
      new DefaultAzureCredential({ managedIdentityClientId: process.env.AZURE_CLIENT_ID })
    )
  }
}

module.exports = createTableClient
