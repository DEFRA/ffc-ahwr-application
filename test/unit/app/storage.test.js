describe('storage tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe('Download blob', () => {
    test.each([
      { mockConnectionStringEnabled: true },
      { mockConnectionStringEnabled: false }
    ])('create blob client with $connectionStringEnabled', async ({ mockConnectionStringEnabled }) => {
      jest.mock('../../../app/config', () => ({
        storage: {
          storageAccount: 'mockStorageAccount',
          useConnectionString: mockConnectionStringEnabled,
          endemicsSettingsContainer: 'endemics-settings',
          connectionString: 'connectionString'
        }
      }))
      const { BlobServiceClient } = require('@azure/storage-blob')
      const mockFromConnectionString = jest.fn()
      jest.mock('@azure/storage-blob')
      BlobServiceClient.fromConnectionString = mockFromConnectionString

      const constructorSpy = jest.spyOn(require('@azure/storage-blob'), 'BlobServiceClient')

      require('../../../app/storage')
      if (mockConnectionStringEnabled) {
        expect(mockFromConnectionString).toHaveBeenCalledTimes(1)
      } else {
        expect(constructorSpy).toHaveBeenCalledTimes(1)
      }
    })

    describe('getBlob', () => {
      test('should return parsed JSON data from downloaded blob', async () => {
        const mockDownloadResponse = {
          readableStreamBody: {
            on: jest.fn(),
            read: jest.fn(),
            once: jest.fn(),
            pause: jest.fn(),
            resume: jest.fn(),
            isPaused: jest.fn(),
            pipe: jest.fn(),
            unpipe: jest.fn(),
            unshift: jest.fn(),
            wrap: jest.fn(),
            [Symbol.asyncIterator]: jest.fn()
          }
        }
        const mockJsonData = { key: 'value' }
        const mockBuffer = Buffer.from(JSON.stringify(mockJsonData))
        const mockStreamToBuffer = jest.fn().mockResolvedValue(mockBuffer)
        const mockDownload = jest.fn()
        const mockBlobClient = jest.fn()
        jest.mock('../../../app/lib/streamToBuffer', () => ({
          streamToBuffer: mockStreamToBuffer
        }))
        const mockGetContainerClient = jest.fn().mockReturnValueOnce({
          getBlobClient: mockBlobClient.mockReturnValueOnce({
            download: mockDownload.mockResolvedValue(mockDownloadResponse)
          })
        })
        const { BlobServiceClient } = require('@azure/storage-blob')
        jest.mock('@azure/storage-blob')
        BlobServiceClient.mockImplementation(() => ({
          getContainerClient: mockGetContainerClient
        }))
        const { getBlob } = require('../../../app/storage')
        const result = await getBlob('filename.json')
        expect(mockGetContainerClient).toHaveBeenCalledTimes(1)
        expect(mockBlobClient).toHaveBeenCalledTimes(1)
        expect(mockDownload).toHaveBeenCalledTimes(1)
        expect(mockStreamToBuffer).toHaveBeenCalledTimes(1)
        expect(result).toEqual(mockJsonData)
      })
    })
  })
})
