import { server } from '../../../../../app/server'
import { applicationStatus } from '../../../../../app/constants'
import {
  searchApplications,
  getApplication,
  updateApplicationByReference,
  findApplication, updateApplicationData
} from '../../../../../app/repositories/application-repository'
import { sendMessage } from '../../../../../app/messaging/send-message'
import { processApplicationApi } from '../../../../../app/messaging/application/process-application'

jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/messaging/send-message')
jest.mock('../../../../../app/messaging/application/process-application')
jest.mock('uuid', () => ({ v4: () => '123456789' }))

const data = { organisation: { sbi: '1231' }, whichReview: 'sheep' }
describe('Applications test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  const reference = 'ABC-1234'

  describe('GET /api/application/get route', () => {
    getApplication.mockResolvedValue({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data } })

    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url: '/api/application/get/ABC-1234'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(getApplication).toHaveBeenCalledTimes(1)
    })
    test('returns 404', async () => {
      getApplication.mockResolvedValue(null)

      const options = {
        method: 'GET',
        url: '/api/application/get/ABC-1234'
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(404)
      expect(getApplication).toHaveBeenCalledTimes(1)
    })
  })

  describe('POST /api/application/search route', () => {
    const method = 'POST'

    searchApplications.mockResolvedValue({
      applications: [{ reference, createdBy: 'admin', createdAt: new Date(), data }],
      total: 1
    })

    test.each([
      { search: { text: '444444444', type: 'sbi' } },
      { search: { text: 'AHWR-555A-FD6E', type: 'ref' } },
      { search: { text: 'applied', type: 'status' } },
      { search: { text: 'data inputted', type: 'status' } },
      { search: { text: 'claimed', type: 'status' } },
      { search: { text: 'check', type: 'status' } },
      { search: { text: 'accepted', type: 'status' } },
      { search: { text: 'rejected', type: 'status' } },
      { search: { text: 'paid', type: 'status' } },
      { search: { text: 'withdrawn', type: 'status' } },
      { search: { text: 'on hold', type: 'status' } }
    ])('returns success when post %p', async ({ search }) => {
      const options = {
        method,
        url: '/api/application/search',
        payload: { search }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(searchApplications).toHaveBeenCalledTimes(1)
    })

    test.each([
      { search: { text: '333333333' } },
      { search: { text: '444444443' } },
      { search: { text: 'AHWR-555A-F5D5' } },
      { search: { text: '' } },
      { search: { text: undefined } }
    ])('returns success with error message when no data found', async ({ search }) => {
      searchApplications.mockReturnValue({
        applications: [],
        total: 0
      })

      const options = {
        method,
        url: '/api/application/search',
        payload: { search }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(searchApplications).toHaveBeenCalledTimes(1)
      const $ = JSON.parse(res.payload)
      expect($.total).toBe(0)
    })

    test.each([
      { search: { text: '333333333' }, limit: 'abc', offset: 0 },
      { search: { text: '444444443' }, offset: 'abc', limit: 20 }
    ])('returns 400 with error message for invalid input', async ({ search, limit, offset }) => {
      const options = {
        method,
        url: '/api/application/search',
        payload: { search, limit, offset }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
    })
  })

  describe('PUT /api/application/search route', () => {
    const method = 'PUT'

    test('returns 200 when new status is Withdrawn (2)', async () => {
      getApplication.mockResolvedValue({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data } })

      const options = {
        method,
        url: '/api/application/ABC-1234',
        payload: { status: applicationStatus.withdrawn, user: 'test' }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(getApplication).toHaveBeenCalledTimes(1)
      expect(updateApplicationByReference).toHaveBeenCalledTimes(1)
    })

    test('returns 200 when new status is In Check (5)', async () => {
      getApplication.mockResolvedValue({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data } })

      const options = {
        method,
        url: '/api/application/ABC-1234',
        payload: { status: applicationStatus.inCheck, user: 'test' }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(getApplication).toHaveBeenCalledTimes(1)
      expect(updateApplicationByReference).toHaveBeenCalledTimes(1)
    })

    test('returns 404 if application doesnt exist', async () => {
      getApplication.mockResolvedValue({ dataValues: null })

      const options = {
        method,
        url: '/api/application/ABC-1234',
        payload: { status: applicationStatus.inCheck, user: 'test' }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(404)
      expect(getApplication).toHaveBeenCalledTimes(1)
    })

    test.each([
      { status: 'abc', user: null },
      { status: 'abc', user: 0 },
      { status: 5000, user: 'test' }
    ])('returns 400 with error message for invalid input', async ({ status, user }) => {
      const options = {
        method,
        url: '/api/application/ABC-1234',
        payload: { status, user }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
    })
  })

  describe('POST /api/application/claim route', () => {
    const method = 'POST'

    test.each([
      { approved: false, user: 'test', reference, payment: 0, statusId: applicationStatus.rejected },
      { approved: true, user: 'test', reference, payment: 1, statusId: applicationStatus.readyToPay }
    ])('returns 200 for valid input', async ({ approved, user, reference, payment, statusId }) => {
      getApplication.mockResolvedValue({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data } })

      const options = {
        method,
        url: '/api/application/claim',
        payload: { approved, user, reference }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(getApplication).toHaveBeenCalledTimes(1)
      expect(updateApplicationByReference).toHaveBeenCalledTimes(1)
      expect(updateApplicationByReference).toHaveBeenCalledWith({ reference, statusId, updatedBy: user })
      expect(sendMessage).toHaveBeenCalledTimes(payment)
    })

    test('returns a 200 when sending message fails, payment failure & status not updated', async () => {
      getApplication.mockResolvedValue({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data } })
      sendMessage.mockImplementation(() => { throw new Error() })

      const options = {
        method,
        url: '/api/application/claim',
        payload: { approved: true, user: 'test', reference }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(getApplication).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(updateApplicationByReference).toHaveBeenCalledTimes(0)
    })

    test('returns 404 when no application is found in the DB', async () => {
      getApplication.mockResolvedValue({ dataValues: null })

      const options = {
        method,
        url: '/api/application/claim',
        payload: { approved: true, user: 'test', reference }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(404)
      expect(getApplication).toHaveBeenCalledTimes(1)
    })

    test.each([
      { approved: false, user: 'test', reference: false },
      { approved: true, user: 0, reference: true },
      { approved: 'wrong', user: 'test', reference }
    ])('returns 400 with error message for invalid input', async ({ approved, user, reference }) => {
      const options = {
        method,
        url: '/api/application/claim',
        payload: { approved, user, reference }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
    })
  })

  describe('POST /api/application/processor', () => {
    const options = {
      method: 'POST',
      url: '/api/application/processor',
      payload: {
        confirmCheckDetails: 'yes',
        whichReview: 'sheep',
        eligibleSpecies: 'yes',
        reference: 'AHWR-5C1C-DD6Z',
        declaration: true,
        offerStatus: 'accepted',
        organisation: {
          farmerName: 'Mr Farmer',
          name: 'My Amazing Farm',
          sbi: '112223',
          cph: '123/456/789',
          crn: '112223',
          address: '1 Example Road',
          email: 'business@email.com',
          isTest: true,
          userType: 'newUser'
        },
        type: 'VV'
      }
    }

    afterAll(() => {
      jest.clearAllMocks()
    })

    test('successfully submitting an application', async () => {
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(processApplicationApi).toHaveBeenCalledTimes(1)
    })

    test('submitting an application fail', async () => {
      processApplicationApi.mockImplementation(async () => { throw new Error() })
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(processApplicationApi).toHaveBeenCalledTimes(1)
    })
  })

  describe('PATCH /api/applications/{reference}/data', () => {
    function getOptionsForUpdatedValue (updatedValue) {
      return {
        method: 'PATCH',
        url: '/api/applications/AHWR-OLDS-KOOL/data',
        payload: {
          ...updatedValue,
          note: 'updated note',
          user: 'Admin'
        }
      }
    }

    afterAll(() => {
      jest.clearAllMocks()
    })

    test('when application not found, return 404', async () => {
      findApplication.mockResolvedValueOnce(null)
      const res = await server.inject(getOptionsForUpdatedValue({ vetName: 'updated person' }))

      expect(res.statusCode).toBe(404)
      expect(updateApplicationData).toHaveBeenCalledTimes(0)
    })

    test('successfully update vetName in application', async () => {
      const existingData = {
        vetName: 'old person',
        visitDate: '2021-01-01',
        vetRcvs: '123456'
      }
      findApplication.mockResolvedValueOnce({ reference: 'AHWR-OLDS-KOOL', createdBy: 'admin', createdAt: new Date(), data: existingData })
      const res = await server.inject(getOptionsForUpdatedValue({ vetName: 'updated person' }))

      expect(res.statusCode).toBe(204)
      expect(updateApplicationData).toHaveBeenCalledTimes(1)
      expect(updateApplicationData).toHaveBeenCalledWith('AHWR-OLDS-KOOL', 'vetName', 'updated person', 'old person', 'updated note', 'Admin')
    })

    test('successfully add vetName in application', async () => {
      const existingData = {
        visitDate: '2021-01-01',
        vetRcvs: '123456'
      }
      findApplication.mockResolvedValueOnce({ reference: 'AHWR-OLDS-KOOL', createdBy: 'admin', createdAt: new Date(), data: existingData })
      const res = await server.inject(getOptionsForUpdatedValue({ vetName: 'updated person' }))

      expect(res.statusCode).toBe(204)
      expect(updateApplicationData).toHaveBeenCalledTimes(1)
      expect(updateApplicationData).toHaveBeenCalledWith('AHWR-OLDS-KOOL', 'vetName', 'updated person', '', 'updated note', 'Admin')
    })

    test('successfully update visitDate in application', async () => {
      const existingData = {
        vetName: 'old person',
        visitDate: '2021-01-01',
        vetRcvs: '123456'
      }
      findApplication.mockResolvedValueOnce({ reference: 'AHWR-OLDS-KOOL', createdBy: 'admin', createdAt: new Date(), data: existingData })
      const res = await server.inject(getOptionsForUpdatedValue({ visitDate: '2025-06-21' }))

      expect(res.statusCode).toBe(204)
      expect(updateApplicationData).toHaveBeenCalledTimes(1)
      expect(updateApplicationData).toHaveBeenCalledWith('AHWR-OLDS-KOOL', 'visitDate', '2025-06-21', '2021-01-01', 'updated note', 'Admin')
    })

    test('successfully add visitDate in application', async () => {
      const existingData = {
        vetName: 'old person',
        vetRcvs: '123456'
      }
      findApplication.mockResolvedValueOnce({ reference: 'AHWR-OLDS-KOOL', createdBy: 'admin', createdAt: new Date(), data: existingData })
      const res = await server.inject(getOptionsForUpdatedValue({ visitDate: '2025-06-21' }))

      expect(res.statusCode).toBe(204)
      expect(updateApplicationData).toHaveBeenCalledTimes(1)
      expect(updateApplicationData).toHaveBeenCalledWith('AHWR-OLDS-KOOL', 'visitDate', '2025-06-21', '', 'updated note', 'Admin')
    })

    test('successfully update vetRcvs in application', async () => {
      const existingData = {
        vetName: 'old person',
        visitDate: '2021-01-01',
        vetRcvs: '1234567'
      }
      findApplication.mockResolvedValueOnce({ reference: 'AHWR-OLDS-KOOL', createdBy: 'admin', createdAt: new Date(), data: existingData })
      const res = await server.inject(getOptionsForUpdatedValue({ vetRcvs: '7654321' }))

      expect(res.statusCode).toBe(204)
      expect(updateApplicationData).toHaveBeenCalledTimes(1)
      expect(updateApplicationData).toHaveBeenCalledWith('AHWR-OLDS-KOOL', 'vetRcvs', '7654321', '1234567', 'updated note', 'Admin')
    })

    test('successfully add vetRcvs in application', async () => {
      const existingData = {
        vetName: 'old person',
        visitDate: '2021-01-01'
      }
      findApplication.mockResolvedValueOnce({ reference: 'AHWR-OLDS-KOOL', createdBy: 'admin', createdAt: new Date(), data: existingData })
      const res = await server.inject(getOptionsForUpdatedValue({ vetRcvs: '7654321' }))

      expect(res.statusCode).toBe(204)
      expect(updateApplicationData).toHaveBeenCalledTimes(1)
      expect(updateApplicationData).toHaveBeenCalledWith('AHWR-OLDS-KOOL', 'vetRcvs', '7654321', '', 'updated note', 'Admin')
    })

    test('when value is not changed return 204 without updating application data', async () => {
      const existingData = {
        vetName: 'old person'
      }
      findApplication.mockResolvedValueOnce({ reference: 'AHWR-OLDS-KOOL', createdBy: 'admin', createdAt: new Date(), data: existingData })
      const res = await server.inject(getOptionsForUpdatedValue({ vetName: 'old person' }))

      expect(res.statusCode).toBe(204)
      expect(updateApplicationData).toHaveBeenCalledTimes(0)
    })
  })
})
