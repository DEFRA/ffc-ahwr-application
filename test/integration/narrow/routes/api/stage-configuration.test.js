const { ValidationError } = require('joi')
const stageConfigurationRepository = require('../../../../../app/repositories/stage-configuration-repository')
jest.mock('../../../../../app/repositories/stage-configuration-repository')
const { when, resetAllWhenMocks } = require('jest-when')

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
    test('returns 404', async () => {
      when(stageConfigurationRepository.getAll)
        .calledWith()
        .mockResolvedValue()
      const options = {
        method: 'GET',
        url
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
      expect(stageConfigurationRepository.getAll).toHaveBeenCalledTimes(1)
      expect(stageConfigurationRepository.getAll).toHaveBeenCalledWith()
      expect(res.result).toEqual('Not Found')
    })
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
    test('returns 500', async () => {
      when(stageConfigurationRepository.getAll)
        .calledWith()
        .mockRejectedValue(new ValidationError('Invalid'))
      const options = {
        method: 'GET',
        url
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(500)
      expect(stageConfigurationRepository.getAll).toHaveBeenCalledTimes(1)
      expect(stageConfigurationRepository.getAll).toHaveBeenCalledWith()
      expect(res.result).toEqual({ err: new ValidationError('Invalid') })
    })
  })

  describe(`GET ${url}/2 route`, () => {
    test('returns 404', async () => {
      when(stageConfigurationRepository.getById)
        .calledWith(2)
        .mockResolvedValue()
      const options = {
        method: 'GET',
        url: `${url}/2`
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
      expect(stageConfigurationRepository.getById).toHaveBeenCalledTimes(1)
      expect(stageConfigurationRepository.getById).toHaveBeenCalledWith(2)
      expect(res.result).toEqual('Not Found')
    })
    test('returns 200', async () => {
      when(stageConfigurationRepository.getById)
        .calledWith(2)
        .mockResolvedValue(mockResponse)
      const options = {
        method: 'GET',
        url: `${url}/2`
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(stageConfigurationRepository.getById).toHaveBeenCalledTimes(1)
      expect(stageConfigurationRepository.getById).toHaveBeenCalledWith(2)
      expect(res.result).toEqual(mockResponse)
    })

    test('returns 400', async () => {
      const options = {
        method: 'GET',
        url: `${url}/invalid`
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(stageConfigurationRepository.getById).toHaveBeenCalledTimes(0)
      expect(res.result).toEqual({ err: new ValidationError('"id" must be a number') })
    })

    test('returns 500', async () => {
      when(stageConfigurationRepository.getById)
        .calledWith(2)
        .mockRejectedValue(new ValidationError('Invalid'))

      const options = {
        method: 'GET',
        url: `${url}/2`
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(500)
      expect(stageConfigurationRepository.getById).toHaveBeenCalledTimes(1)
      expect(stageConfigurationRepository.getById).toHaveBeenCalledWith(2)
      expect(res.result).toEqual({ err: new ValidationError('Invalid') })
    })
  })
})
