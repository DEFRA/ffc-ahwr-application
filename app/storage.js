import { BlobServiceClient } from '@azure/storage-blob'
import { DefaultAzureCredential } from '@azure/identity'
import { config } from './config'
import { streamToBuffer } from './lib/streamToBuffer'

let blobServiceClient

const { connectionString, useConnectionString, endemicsSettingsContainer, storageAccount } = config.storage

if (useConnectionString === true) {
  blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
} else {
  const uri = `https://${storageAccount}.blob.core.windows.net`
  blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential())
}

export const getBlob = async (filename) => {
  const container = blobServiceClient.getContainerClient(endemicsSettingsContainer)
  const blobClient = container.getBlobClient(filename)
  const downloadResponse = await blobClient.download()
  const downloaded = await streamToBuffer(downloadResponse.readableStreamBody)
  return JSON.parse(downloaded.toString())
}
