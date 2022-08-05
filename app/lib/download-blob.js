const { BlobServiceClient } = require('@azure/storage-blob')
const { DefaultAzureCredential } = require('@azure/identity')
const { storage: { connectionString, useConnectionString, storageAccount } } = require('../config')

/**
 * Downloads the file from the provided container using the given
 * connectionString. If the file doesn't exist `undefined` is returned.
 *
 * @param {string} connectionString.
 * @param {string} container where file is located.
 * @param {string} file to attempt to download.
 * @returns {string} representing the content of the file or `undefined` if
 * there is no file.
 */
module.exports = async (container, file) => {
  let blobServiceClient
  if (useConnectionString === true) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  } else {
    const uri = `https://${storageAccount}.blob.core.windows.net`
    blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential())
  }

  const client = blobServiceClient.getContainerClient(container)

  if (await client.exists()) {
    try {
      const blob = client.getBlockBlobClient(file)
      return (await blob.downloadToBuffer()).toString()
    } catch (e) {
      console.error(e)
    }
  }
  return undefined
}
