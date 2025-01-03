import { config } from '../config'
import { streamToBuffer } from '../lib/streamToBuffer'
import { getBlobServiceClient } from './getBlobServiceClient'

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
