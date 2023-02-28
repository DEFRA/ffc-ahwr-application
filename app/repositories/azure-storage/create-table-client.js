const { DefaultAzureCredential } = require('@azure/identity')
const { TableClient } = require('@azure/data-tables')
const { storage: { connectionString, useConnectionString, storageAccount } } = require('../../config')

const createTableClient = (tableName) => {
  if (useConnectionString) {
    console.log(`${new Date().toISOString()} Creating the table client using the connection string: ${JSON.stringify({
      connectionString,
      tableName
    })}`)
    return TableClient.fromConnectionString(
      connectionString,
      tableName,
      {
        allowInsecureConnection: true
      }
    )
  } else {
    console.log(`${new Date().toISOString()} Creating the table client using the DefaultAzureCredential: ${JSON.stringify({
      accountName: storageAccount,
      tableName
    })}`)
    return new TableClient(
      `https://${storageAccount}.table.core.windows.net`,
      tableName,
      new DefaultAzureCredential()
    )
  }
}

module.exports = createTableClient
