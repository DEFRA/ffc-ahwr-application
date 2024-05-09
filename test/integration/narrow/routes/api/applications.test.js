const statusIds = require('../../../../../app/constants/application-status')
const applicationRepository = require('../../../../../app/repositories/application-repository')
const sendMessage = require('../../../../../app/messaging/send-message')
const { processApplicationApi } = require('../../../../../app/messaging/application/process-application')
jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/messaging/send-message')
jest.mock('../../../../../app/messaging/application/process-application')
jest.mock('uuid', () => ({ v4: () => '123456789' }))

const data = { organisation: { sbi: '1231' }, whichReview: 'sheep' }
describe('Applications test', () => {
  const server = require('../../../../../app/server')

  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })
  const reference = 'ABC-1234'
  let url = `/api/application/get/${reference}`
  applicationRepository.searchApplications.mockResolvedValue({
    applications: [{ reference, createdBy: 'admin', createdAt: new Date(), data }],
    total: 1
  })
  applicationRepository.get.mockResolvedValue({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data } })
  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url: '/api/application/get/ABC-1234'
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    })
    test('returns 404', async () => {
      applicationRepository.get.mockResolvedValue({ dataValues: null })
      const options = {
        method: 'GET',
        url: '/api/application/get/ABC-1234'
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
      expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    })
  })
  url = '/api/application/search'
  describe(`POST ${url} route`, () => {
    const method = 'POST'
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
        url,
        payload: { search }
      }

      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(applicationRepository.searchApplications).toHaveBeenCalledTimes(1)
    })
    test.each([
      { search: { text: '333333333' } },
      { search: { text: '444444443' } },
      { search: { text: 'AHWR-555A-F5D5' } },
      { search: { text: '' } },
      { search: { text: undefined } }
    ])('returns success with error message when no data found', async ({ search }) => {
      const options = {
        method,
        url,
        payload: { search }
      }

      applicationRepository.searchApplications.mockReturnValue({
        applications: [],
        total: 0
      })
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(applicationRepository.searchApplications).toHaveBeenCalledTimes(1)
      const $ = JSON.parse(res.payload)
      expect($.total).toBe(0)
    })

    test.each([
      { search: { text: '333333333' }, limit: 'abc', offset: 0 },
      { search: { text: '444444443' }, offset: 'abc', limit: 20 }
    ])('returns 400 with error message for invalid input', async ({ search, limit, offset }) => {
      const options = {
        method,
        url,
        payload: { search, limit, offset }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
    })
  })
  describe(`PUT ${url} route`, () => {
    const method = 'PUT'
    test('returns 200 when new status is Withdrawn (2)', async () => {
      applicationRepository.get.mockResolvedValue({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data } })
      const options = {
        method,
        url: '/api/application/ABC-1234',
        payload: { status: 2, user: 'test' }
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(applicationRepository.get).toHaveBeenCalledTimes(1)
      expect(applicationRepository.updateByReference).toHaveBeenCalledTimes(1)
    })
    test('returns 200 when new status is In Check (2)', async () => {
      applicationRepository.get.mockResolvedValue({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data } })
      const options = {
        method,
        url: '/api/application/ABC-1234',
        payload: { status: 5, user: 'test' }
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(applicationRepository.get).toHaveBeenCalledTimes(1)
      expect(applicationRepository.updateByReference).toHaveBeenCalledTimes(1)
    })
    test('returns 404 when no dataValues sent', async () => {
      applicationRepository.get.mockResolvedValue({ dataValues: null })
      const options = {
        method,
        url: '/api/application/ABC-1234',
        payload: { status: 2, user: 'test' }
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
      expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    })
    test.each([
      { status: 'abc', user: null },
      { status: 'abc', user: 0 },
      { status: 5000, user: 'test' },
      { status: 9, user: 'test' }
    ])('returns 400 with error message for invalid input', async ({ status, user }) => {
      const options = {
        method,
        url,
        payload: { status, user }
      }
      const res = await server.inject(options)

      expect(res.statusCode).toBe(400)
    })
  })

  describe(`POST ${url} route`, () => {
    const method = 'POST'
    const consoleLogSpy = jest.spyOn(console, 'log')
    const consoleErrorSpy = jest.spyOn(console, 'error')
    test.each([
      { approved: false, user: 'test', reference, payment: 0, statusId: statusIds.rejected },
      { approved: true, user: 'test', reference, payment: 1, statusId: statusIds.readyToPay }
    ])('returns 200 for valid input', async ({ approved, user, reference, payment, statusId }) => {
      applicationRepository.get.mockResolvedValue({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data } })
      const options = {
        method,
        url: '/api/application/claim',
        payload: { approved, user, reference }
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(applicationRepository.get).toHaveBeenCalledTimes(1)
      expect(applicationRepository.updateByReference).toHaveBeenCalledTimes(1)
      expect(applicationRepository.updateByReference).toHaveBeenCalledWith({ reference, statusId, updatedBy: user })
      expect(sendMessage).toHaveBeenCalledTimes(payment)
      expect(consoleLogSpy).toHaveBeenCalledTimes(1)
      expect(consoleLogSpy).toHaveBeenCalledWith(`Status of application with reference ${reference} successfully updated`)
    })
    test('returns a 200, payment failure & status not updated', async () => {
      applicationRepository.get.mockResolvedValue({ dataValues: { reference, createdBy: 'admin', createdAt: new Date(), data } })
      sendMessage.mockImplementation(() => { throw new Error() })
      const options = {
        method,
        url: '/api/application/claim',
        payload: { approved: true, user: 'test', reference }
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      expect(applicationRepository.get).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(applicationRepository.updateByReference).not.toBeCalled()
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith(`Status of application with reference ${reference} failed to update`)
    })
    test('returns 404', async () => {
      applicationRepository.get.mockResolvedValue({ dataValues: null })
      const options = {
        method,
        url: '/api/application/claim',
        payload: { approved: true, user: 'test', reference }
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
      expect(applicationRepository.get).toHaveBeenCalledTimes(1)
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

    test('succesfully submiting an application', async () => {
      const res = await server.inject(options)

      expect(res.statusCode).toBe(200)
      expect(processApplicationApi).toHaveBeenCalledTimes(1)
    })

    test('submiting an application fail', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      processApplicationApi.mockImplementation(async () => { throw new Error() })
      const res = await server.inject(options)
      expect(res.statusCode).toBe(400)
      expect(processApplicationApi).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to process application : Error')
    })
  })
})
