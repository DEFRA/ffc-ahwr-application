import { config } from '../config/index.js'
import { streamToBuffer } from '../lib/streamToBuffer.js'
import { getBlobServiceClient } from './getBlobServiceClient.js'

export const getBlob = async (filename) => {
  const {
    connectionString,
    useConnectionString,
    endemicsSettingsContainer,
    storageAccount
  } = config.storage

  const blobServiceClient = getBlobServiceClient(useConnectionString, connectionString, storageAccount)
  const container = blobServiceClient.getContainerClient(
    endemicsSettingsContainer
  )
  const blobClient = container.getBlobClient(filename)
  const downloadResponse = await blobClient.download()
  const downloaded = await streamToBuffer(downloadResponse.readableStreamBody)

  return JSON.parse(downloaded.toString())
}
