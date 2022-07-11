const applicationRepository = require('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/repositories/application-repository')
const data = {}
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
      { search: { text: 'VV-555A-FD6E', type: 'ref' } },
      { search: { text: 'applied', type: 'status' } },
      { search: { text: 'data inputed', type: 'status' } },
      { search: { text: 'claimed', type: 'status' } },
      { search: { text: 'check', type: 'status' } },
      { search: { text: 'accepted', type: 'status' } },
      { search: { text: 'rejected', type: 'status' } },
      { search: { text: 'paid', type: 'status' } },
      { search: { text: 'withdrawn', type: 'status' } }
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
      { search: { text: 'VV-555A-F5D5' } },
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
})
