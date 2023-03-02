const applicationStatusRepository = require('../../../../../app/azure-storage/application-status-repository')
jest.mock('../../../../../app/azure-storage/application-status-repository')

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
      applicationStatusRepository.getApplicationHistory.mockResolvedValue({
        historyRecords: [{ date: '23/03/2023', time: '10:00:12', statusId: 9, user: 'Daniel Jones' },
          { date: '24/03/2023', time: '09:30:00', statusId: 2, user: 'Daniel Jones' },
          { date: '25/03/2023', time: '11:10:15', statusId: 10, user: 'Amanda Hassan' }]
      })
      const options = {
        method: 'GET',
        url: '/api/application/history/ABC-1234'
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
    })
    test('returns 404', async () => {
      applicationStatusRepository.getApplicationHistory.mockResolvedValue({ historyRecords: null })

      const options = {
        method: 'GET',
        url: '/api/application/history/ABC-1234'
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(404)
      expect(applicationStatusRepository.getApplicationHistory).toHaveBeenCalledTimes(1)
    })
  })
})
