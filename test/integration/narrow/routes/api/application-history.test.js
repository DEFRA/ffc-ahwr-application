describe('Application history test', () => {
  const server = require('../../../../../app/server')

  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })
  const reference = 'ABC-1234'
  const url = `/api/application/history/${reference}`

  describe(`GET ${url} route`, () => {
    test('returns 200', async () => {
      const options = {
        method: 'GET',
        url: '/api/application/history/ABC-1234'
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
    })
    test.skip('returns 404', async () => {
      // applicationRepository.get.mockResolvedValue({ dataValues: null })
      const options = {
        method: 'GET',
        url: '/api/application/history/ABC-1234'
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
    })
  })
})
