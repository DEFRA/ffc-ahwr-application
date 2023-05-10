const stageExecutionRepository = require('../../../../../app/repositories/stage-execution-repository')
jest.mock('../../../../../app/repositories/stage-execution-repository')
const { when, resetAllWhenMocks } = require('jest-when')

const data = {
  applicationReference: 'AHWR-0000-0000',
  stageConfigurationId: 2,
  executedBy: 'Mr User',
  processedAt: null
}

const mockResponse = {
  id: 13,
  applicationReference: 'AHWR-0000-0000',
  stageConfigurationId: 2,
  executedBy: 'Mr User',
  processedAt: null,
  executedAt: '2023-05-09T13:00:48.393Z',
  action: null
}

describe('Stage execution test', () => {
  const server = require('../../../../../app/server')

  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
    resetAllWhenMocks()
  })
  const url = '/api/stageexecution'
  stageExecutionRepository.getAll.mockResolvedValue(mockResponse)
  stageExecutionRepository.set.mockResolvedValue(mockResponse)
  stageExecutionRepository.update.mockResolvedValue(mockResponse)

  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(stageExecutionRepository.getAll).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.getAll).toHaveBeenCalledWith()
      expect(res.result).toEqual(mockResponse)
    })
  })

  describe(`POST ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'POST',
        url,
        payload: data
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(stageExecutionRepository.set).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.set).toHaveBeenCalledWith({ ...data, executedAt: expect.any(Date) })
      expect(res.result).toEqual(mockResponse)
    })
  })

  describe(`PUT ${url} route`, () => {
    test('returns 200', async () => {
      when(stageExecutionRepository.getById)
        .calledWith(2)
        .mockResolvedValue(mockResponse)
      const options = {
        method: 'PUT',
        url: `${url}/2`
      }
      const res = await server.inject(options)
      console.log(res, 'res')
      expect(res.statusCode).toBe(200)
      expect(stageExecutionRepository.update).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.update).toHaveBeenCalledWith({ id: 2 })
      expect(res.result).toEqual(mockResponse)
    })
  })
})
