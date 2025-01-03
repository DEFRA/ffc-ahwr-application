import { BlobServiceClient } from '@azure/storage-blob'
import { DefaultAzureCredential } from '@azure/identity'

export const getBlobServiceClient = (useConnectionString, connectionString, storageAccount) => {
  if (useConnectionString === true) {
    return BlobServiceClient.fromConnectionString(connectionString)
  }

  const uri = `https://${storageAccount}.blob.core.windows.net`
  return new BlobServiceClient(uri, new DefaultAzureCredential())
}
