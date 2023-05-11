const { ValidationError } = require('joi')
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
    test('returns 404', async () => {
      when(stageExecutionRepository.getAll)
        .calledWith()
        .mockResolvedValue()
      const options = {
        method: 'GET',
        url
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
      expect(stageExecutionRepository.getAll).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.getAll).toHaveBeenCalledWith()
      expect(res.result).toEqual('Not Found')
    })
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

    test('returns 400', async () => {
      when(stageExecutionRepository.getAll)
        .calledWith()
        .mockRejectedValue(new ValidationError('Invalid'))
      const options = {
        method: 'GET',
        url
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(stageExecutionRepository.getAll).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.getAll).toHaveBeenCalledWith()
      expect(res.result).toEqual({ err: new ValidationError('Invalid') })
    })
  })

  describe(`GET ${url}/AHWR-0000-0000 route`, () => {
    test('returns 200', async () => {
      when(stageExecutionRepository.getByApplicationReference)
        .calledWith('AHWR-0000-0000')
        .mockResolvedValue(mockResponse)
      const options = {
        method: 'GET',
        url: `${url}/AHWR-0000-0000`
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(stageExecutionRepository.getByApplicationReference).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.getByApplicationReference).toHaveBeenCalledWith('AHWR-0000-0000')
      expect(res.result).toEqual(mockResponse)
    })

    test('returns 400', async () => {
      when(stageExecutionRepository.getByApplicationReference)
        .calledWith('AHWR-0000-0000')
        .mockRejectedValue(new ValidationError('Invalid'))
      const options = {
        method: 'GET',
        url: `${url}/AHWR-0000-0000`
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(stageExecutionRepository.getByApplicationReference).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.getByApplicationReference).toHaveBeenCalledWith('AHWR-0000-0000')
      expect(res.result).toEqual({ err: new ValidationError('Invalid') })
    })

    test('returns 404', async () => {
      when(stageExecutionRepository.getByApplicationReference)
        .calledWith('AHWR-0000-0000')
        .mockResolvedValue()
      const options = {
        method: 'GET',
        url: `${url}/AHWR-0000-0000`
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
      expect(stageExecutionRepository.getByApplicationReference).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.getByApplicationReference).toHaveBeenCalledWith('AHWR-0000-0000')
      expect(res.result).toEqual('Not Found')
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

    test('returns 400', async () => {
      when(stageExecutionRepository.set)
        .calledWith({ ...data, executedAt: expect.any(Date) })
        .mockRejectedValue(new ValidationError('Invalid'))
      const options = {
        method: 'POST',
        url,
        payload: data
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(stageExecutionRepository.set).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.set).toHaveBeenCalledWith({ ...data, executedAt: expect.any(Date) })
      expect(res.result).toEqual({ err: new ValidationError('Invalid') })
    })

    test.each([
      {
        data: { ...data, applicationReference: null },
        error: new ValidationError('"applicationReference" must be a string')
      },
      {
        data: { ...data, stageConfigurationId: -1 },
        error: new ValidationError('"stageConfigurationId" must be greater than 0')
      },
      {
        data: { ...data, executedBy: null },
        error: new ValidationError('"executedBy" must be a string')
      },
      {
        data: { ...data, action: { action: null } },
        error: new ValidationError('"action.action" must be a string')
      }
    ])('returns 400 when bad request', async (testCase) => {
      const options = {
        method: 'POST',
        url,
        payload: testCase.data
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(stageExecutionRepository.set).toHaveBeenCalledTimes(0)
      expect(res.result).toEqual({ err: testCase.error })
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

    test('returns 400 when error thrown', async () => {
      when(stageExecutionRepository.update)
        .calledWith({ id: 2 })
        .mockRejectedValue(new ValidationError('Invalid'))
      when(stageExecutionRepository.getById)
        .calledWith(2)
        .mockResolvedValue(mockResponse)
      const options = {
        method: 'PUT',
        url: `${url}/2`
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
      expect(stageExecutionRepository.update).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.update).toHaveBeenCalledWith({ id: 2 })
      expect(res.result).toEqual({ err: new ValidationError('Invalid') })
    })

    test('returns 404', async () => {
      when(stageExecutionRepository.getById)
        .calledWith(2)
        .mockResolvedValue()
      const options = {
        method: 'PUT',
        url: `${url}/2`
      }
      const res = await server.inject(options)
      console.log(res, 'res')
      expect(res.statusCode).toBe(404)
      expect(stageExecutionRepository.getById).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.update).toHaveBeenCalledTimes(0)
      expect(res.result).toEqual('Not Found')
    })

    test('returns 400', async () => {
      when(stageExecutionRepository.getById)
        .calledWith(2)
        .mockResolvedValue(mockResponse)
      const options = {
        method: 'PUT',
        url: `${url}/-2`
      }
      const res = await server.inject(options)
      console.log(res, 'res')
      expect(res.statusCode).toBe(400)
      expect(stageExecutionRepository.update).toHaveBeenCalledTimes(0)
      expect(res.result).toEqual({ err: new ValidationError('"id" must be greater than 0') })
    })
  })
})
