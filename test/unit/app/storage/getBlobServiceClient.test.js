import { BlobServiceClient } from '@azure/storage-blob'
import { getBlobServiceClient } from '../../../../app/storage/getBlobServiceClient'

const mockFromConnectionString = jest.fn()
jest.mock('@azure/storage-blob')
BlobServiceClient.fromConnectionString = mockFromConnectionString

const constructorSpy = jest.spyOn(
  require('@azure/storage-blob'),
  'BlobServiceClient'
)

describe('getBlobServiceClient', () => {
  afterAll(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  test('create the BlobServiceClient with useConnectionString = true', () => {
    const connectionString = 'test'
    getBlobServiceClient(true, connectionString, 'storage-account')
    expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith(
      connectionString
    )
  })

  test('create the BlobServiceClient with useConnectionString = false', () => {
    const connectionString = 'test'
    const storageAccount = 'storage-account-000'
    getBlobServiceClient(false, connectionString, storageAccount)
    expect(constructorSpy).toHaveBeenCalledWith(
      `https://${storageAccount}.blob.core.windows.net`,
      expect.anything()
    )
  })
})
