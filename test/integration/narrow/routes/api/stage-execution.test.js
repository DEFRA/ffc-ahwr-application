const { ValidationError } = require('joi')
const stageExecutionRepository = require('../../../../../app/repositories/stage-execution-repository')
jest.mock('../../../../../app/repositories/stage-execution-repository')
jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/claim-repository')
const { get, updateByReference } = require('../../../../../app/repositories/application-repository')
const claim = require('../../../../../app/repositories/claim-repository')
const { when, resetAllWhenMocks } = require('jest-when')

const data = {
  applicationReference: 'AHWR-0000-0000',
  claimOrApplication: 'application',
  stageConfigurationId: 2,
  executedBy: 'Mr User',
  processedAt: null,
  action: {
    action: 'Recommend to pay'
  }
}

const mockResponse = {
  id: 13,
  applicationReference: 'AHWR-0000-0000',
  claimOrApplication: 'application',
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
    test.each([
      { action: 'Ready to pay' },
      { action: 'Rejected' },
      { action: 'Recommend to pay' },
      { action: 'Recommend to reject' }
    ])('returns 200 when Recommend to pay', async ({ action }) => {
      const mockGet = {
        dataValues: {
          id: 1,
          data: {
            organisation: {
              sbi: 123
            }
          }
        }
      }

      when(claim.getByReference).calledWith('AHWR-0000-0000').mockResolvedValue(mockGet)
      when(claim.updateByReference).mockResolvedValue({ ...mockResponse, claimOrApplication: 'claim', action: { action } })
      when(get).calledWith('AHWR-0000-0000').mockResolvedValue(mockGet)
      when(stageExecutionRepository.set).mockResolvedValue({ ...mockResponse, claimOrApplication: 'claim', action: { action } })

      const options = {
        method: 'POST',
        url,
        payload: { ...data, claimOrApplication: 'claim', action: { action } }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(stageExecutionRepository.set).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.set).toHaveBeenCalledWith({ ...data, claimOrApplication: 'claim', action: { action }, executedAt: expect.any(Date) }, mockGet)
      expect(claim.updateByReference).toHaveBeenCalledTimes(1)
      expect(res.result).toEqual({ ...mockResponse, claimOrApplication: 'claim', action: { action } })
    })
    test('returns 200 when Recommend to pay', async () => {
      const mockGet = {
        dataValues: {
          id: 1,
          data: {
            organisation: {
              sbi: 123
            }
          }
        }
      }
      when(get).calledWith('AHWR-0000-0000').mockResolvedValue(mockGet)
      when(stageExecutionRepository.set)
        .calledWith({ ...data, executedAt: expect.any(Date) }, 123)
        .mockResolvedValue(mockResponse)

      const options = {
        method: 'POST',
        url,
        payload: data
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(stageExecutionRepository.set).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.set).toHaveBeenCalledWith({ ...data, executedAt: expect.any(Date) }, mockGet)
      expect(updateByReference).toHaveBeenCalledTimes(1)
      expect(res.result).toEqual(mockResponse)
    })

    test('returns 200 when Recommend to reject', async () => {
      const mockGet = {
        dataValues: {
          id: 1,
          data: {
            organisation: {
              sbi: 123
            }
          }
        }
      }
      const data2 = { ...data, action: { action: 'Recommend to reject' } }
      when(get).calledWith('AHWR-0000-0000').mockResolvedValue(mockGet)
      when(stageExecutionRepository.set)
        .calledWith({ ...data2, executedAt: expect.any(Date) }, 123)
        .mockResolvedValue(mockResponse)

      const options = {
        method: 'POST',
        url,
        payload: data2
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(stageExecutionRepository.set).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.set).toHaveBeenCalledWith({ ...data2, executedAt: expect.any(Date) }, mockGet)
      expect(updateByReference).toHaveBeenCalledTimes(1)
      expect(res.result).toEqual(mockResponse)
    })

    test('returns 404', async () => {
      when(get).calledWith('AHWR-0000-0000').mockResolvedValue({})

      const options = {
        method: 'POST',
        url,
        payload: data
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(get).toHaveBeenCalledTimes(1)
      expect(get).toHaveBeenCalledWith('AHWR-0000-0000')
      expect(res.result).toEqual('Reference not found')
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
      expect(res.statusCode).toBe(200)
      expect(stageExecutionRepository.update).toHaveBeenCalledTimes(1)
      expect(stageExecutionRepository.update).toHaveBeenCalledWith({ id: 2 })
      expect(res.result).toEqual(mockResponse)
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
      expect(res.statusCode).toBe(400)
      expect(stageExecutionRepository.update).toHaveBeenCalledTimes(0)
      expect(res.result).toEqual({ err: new ValidationError('"id" must be greater than 0') })
    })
  })
})
