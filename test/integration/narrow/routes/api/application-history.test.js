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
    test('returns 200 with data', async () => {
      applicationStatusRepository.getApplicationHistory.mockResolvedValue(
        [{ ChangedOn: '2023-03-23T10:00:12.000Z', Payload: '{\n  "reference": "AHWR-7C72-8871",\n  "statusId": 91\n}', ChangedBy: 'Daniel Jones' },
          { ChangedOn: '2023-03-24T09:30:00.000Z', Payload: '{\n  "reference": "AHWR-7C72-8871",\n  "statusId": 2\n}', ChangedBy: 'Daniel Jones' },
          { ChangedOn: '2023-03-25T11:10:15:12.000Z', Payload: '{\n  "reference": "AHWR-7C72-8871",\n  "statusId": 10\n}', ChangedBy: 'Amanda Hassan' }]
      )
      const options = {
        method: 'GET',
        url: '/api/application/history/ABC-1234'
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      const $ = JSON.parse(res.payload)
      expect($.historyRecords).not.toBeNull()
      expect($.historyRecords.length).toBe(3)
    })
    test('returns 200 with no data', async () => {
      applicationStatusRepository.getApplicationHistory.mockResolvedValue(null)
      const options = {
        method: 'GET',
        url: '/api/application/history/ABC-1234'
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      const $ = JSON.parse(res.payload)
      expect($.historyRecords).toBeNull()
    })
  })
})
