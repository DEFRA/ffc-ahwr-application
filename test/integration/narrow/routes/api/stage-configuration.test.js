const stageConfigurationRepository = require('../../../../../app/repositories/stage-configuration-repository')
jest.mock('../../../../../app/repositories/stage-configuration-repository')
const { resetAllWhenMocks } = require('jest-when')

const mockResponse = {
  id: 13,
  applicationReference: 'AHWR-0000-0000',
  stageConfigurationId: 2,
  executedBy: 'Mr User',
  processedAt: null,
  executedAt: '2023-05-09T13:00:48.393Z',
  action: null
}

describe('Stage configuration test', () => {
  const server = require('../../../../../app/server')

  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
    resetAllWhenMocks()
  })
  const url = '/api/stageconfiguration'
  stageConfigurationRepository.getAll.mockResolvedValue([mockResponse])

  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(stageConfigurationRepository.getAll).toHaveBeenCalledTimes(1)
      expect(stageConfigurationRepository.getAll).toHaveBeenCalledWith()
      expect(res.result).toEqual([mockResponse])
    })
  })
})
