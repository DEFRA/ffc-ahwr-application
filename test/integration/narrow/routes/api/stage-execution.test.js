import { ValidationError } from 'joi'
import { getAll, getById, set, update, getByApplicationReference } from '../../../../../app/repositories/stage-execution-repository'
import { getClaimByReference, updateClaimByReference } from '../../../../../app/repositories/claim-repository'
import { getApplication, updateApplicationByReference } from '../../../../../app/repositories/application-repository'
import { when, resetAllWhenMocks } from 'jest-when'
import { server } from '../../../../../app/server'
import { applicationStatus } from '../../../../../app/constants'

jest.mock('../../../../../app/repositories/stage-execution-repository')
jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/claim-repository')

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
  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
    resetAllWhenMocks()
  })
  const url = '/api/stageexecution'
  getAll.mockResolvedValue(mockResponse)
  set.mockResolvedValue(mockResponse)
  update.mockResolvedValue(mockResponse)

  describe(`GET ${url} route`, () => {
    test('returns 404', async () => {
      when(getAll)
        .calledWith()
        .mockResolvedValue()
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
      expect(res.result).toEqual(mockResponse)
    })
  })

  describe(`GET ${url}/AHWR-0000-0000 route`, () => {
    test('returns 200', async () => {
      when(getByApplicationReference).mockResolvedValue(mockResponse)
      const options = {
        method: 'GET',
        url: `${url}/AHWR-0000-0000`
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(getByApplicationReference).toHaveBeenCalledTimes(1)
      expect(getByApplicationReference).toHaveBeenCalledWith('AHWR-0000-0000')
      expect(res.result).toEqual(mockResponse)
    })

    test('returns 404 when no application is found in DB', async () => {
      when(getByApplicationReference)
        .mockResolvedValue()
      const options = {
        method: 'GET',
        url: `${url}/AHWR-0000-0000`
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(404)
      expect(getByApplicationReference).toHaveBeenCalledTimes(1)
      expect(getByApplicationReference).toHaveBeenCalledWith('AHWR-0000-0000')
      expect(res.result).toEqual('Not Found')
    })
  })

  describe(`POST ${url} route`, () => {
    test.each([
      { action: 'Ready to pay', expectedStatusId: applicationStatus.readyToPay },
      { action: 'Rejected', expectedStatusId: applicationStatus.rejected },
      { action: 'Recommend to pay', expectedStatusId: applicationStatus.recommendToPay },
      { action: 'Recommend to reject', expectedStatusId: applicationStatus.recommendToReject }
    ])('returns 200 when Recommend to pay', async ({ action, expectedStatusId }) => {
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

      when(getClaimByReference).calledWith('AHWR-0000-0000').mockResolvedValue(mockGet)
      when(updateApplicationByReference).mockResolvedValue({ ...mockResponse, claimOrApplication: 'claim', action: { action } })
      when(getApplication).calledWith('AHWR-0000-0000').mockResolvedValue(mockGet)
      when(set).mockResolvedValue({ ...mockResponse, claimOrApplication: 'claim', action: { action } })

      const options = {
        method: 'POST',
        url,
        payload: { ...data, claimOrApplication: 'claim', action: { action } }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(set).toHaveBeenCalledTimes(1)
      expect(set).toHaveBeenCalledWith({ ...data, claimOrApplication: 'claim', action: { action }, executedAt: expect.any(Date) })
      expect(updateClaimByReference).toHaveBeenCalledWith({ reference: data.applicationReference, statusId: expectedStatusId, updatedBy: data.executedBy })
      expect(res.result).toEqual({ ...mockResponse, claimOrApplication: 'claim', action: { action } })
    })
    test('returns 200 when an application is Recommended to pay', async () => {
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
      when(getApplication).calledWith('AHWR-0000-0000').mockResolvedValue(mockGet)
      // when(set)
      //   .calledWith({ ...data, executedAt: expect.any(Date) }, 123)
      //   .mockResolvedValue(mockResponse)

      const options = {
        method: 'POST',
        url,
        payload: data
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(set).toHaveBeenCalledTimes(1)
      expect(set).toHaveBeenCalledWith({ ...data, executedAt: expect.any(Date) })
      expect(updateApplicationByReference).toHaveBeenCalledTimes(1)
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
      when(getApplication).calledWith('AHWR-0000-0000').mockResolvedValue(mockGet)
      when(set)
        .calledWith({ ...data2, executedAt: expect.any(Date) }, 123)
        .mockResolvedValue(mockResponse)

      const options = {
        method: 'POST',
        url,
        payload: data2
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(set).toHaveBeenCalledTimes(1)
      expect(set).toHaveBeenCalledWith({ ...data2, executedAt: expect.any(Date) })
      expect(updateApplicationByReference).toHaveBeenCalledTimes(1)
      expect(res.result).toEqual(mockResponse)
    })

    test('returns 404', async () => {
      when(getApplication).calledWith('AHWR-0000-0000').mockResolvedValue({})

      const options = {
        method: 'POST',
        url,
        payload: data
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(getApplication).toHaveBeenCalledTimes(1)
      expect(getApplication).toHaveBeenCalledWith('AHWR-0000-0000')
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
      expect(set).toHaveBeenCalledTimes(0)
      expect(res.result).toEqual({ err: testCase.error })
    })
  })

  describe(`PUT ${url} route`, () => {
    test('returns 200', async () => {
      when(getById)
        .calledWith(2)
        .mockResolvedValue(mockResponse)
      const options = {
        method: 'PUT',
        url: `${url}/2`
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(update).toHaveBeenCalledTimes(1)
      expect(update).toHaveBeenCalledWith({ id: 2 })
      expect(res.result).toEqual(mockResponse)
    })

    test('returns 404', async () => {
      when(getById)
        .calledWith(2)
        .mockResolvedValue()
      const options = {
        method: 'PUT',
        url: `${url}/2`
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
      expect(getById).toHaveBeenCalledTimes(1)
      expect(update).toHaveBeenCalledTimes(0)
      expect(res.result).toEqual('Not Found')
    })

    test('returns 400', async () => {
      when(getById)
        .calledWith(2)
        .mockResolvedValue(mockResponse)
      const options = {
        method: 'PUT',
        url: `${url}/-2`
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(update).toHaveBeenCalledTimes(0)
      expect(res.result).toEqual({ err: new ValidationError('"id" must be greater than 0') })
    })
  })
})
