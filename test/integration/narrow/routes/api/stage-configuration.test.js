import { ValidationError } from 'joi'
import { server } from '../../../../../app/server'
import { getAll, getById } from '../../../../../app/repositories/stage-configuration-repository'
import { when, resetAllWhenMocks } from 'jest-when'

jest.mock('../../../../../app/repositories/stage-configuration-repository')

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
  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
    resetAllWhenMocks()
  })
  const url = '/api/stageconfiguration'
  getAll.mockResolvedValueOnce().mockResolvedValue([mockResponse])

  describe(`GET ${url} route`, () => {
    test('returns 404', async () => {
      const options = {
        method: 'GET',
        url
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
      expect(getAll).toHaveBeenCalledTimes(1)
      expect(getAll).toHaveBeenCalledWith()
      expect(res.result).toEqual('Not Found')
    })
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(getAll).toHaveBeenCalledTimes(1)
      expect(getAll).toHaveBeenCalledWith()
      expect(res.result).toEqual([mockResponse])
    })
  })

  describe(`GET ${url}/2 route`, () => {
    test('returns 404', async () => {
      when(getById)
        .calledWith(2)
        .mockResolvedValue()
      const options = {
        method: 'GET',
        url: `${url}/2`
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
      expect(getById).toHaveBeenCalledTimes(1)
      expect(getById).toHaveBeenCalledWith(2)
      expect(res.result).toEqual('Not Found')
    })
    test('returns 200', async () => {
      when(getById)
        .calledWith(2)
        .mockResolvedValue(mockResponse)
      const options = {
        method: 'GET',
        url: `${url}/2`
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(getById).toHaveBeenCalledTimes(1)
      expect(getById).toHaveBeenCalledWith(2)
      expect(res.result).toEqual(mockResponse)
    })

    test('returns 400', async () => {
      const options = {
        method: 'GET',
        url: `${url}/invalid`
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(getById).toHaveBeenCalledTimes(0)
      expect(res.result).toEqual({ err: new ValidationError('"id" must be a number') })
    })
  })
})
