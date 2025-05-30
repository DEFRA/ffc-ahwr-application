import { server } from '../../../../../app/server'
import { getApplicationEvents } from '../../../../../app/azure-storage/application-eventstore-repository'

jest.mock('../../../../../app/azure-storage/application-eventstore-repository')

describe('Application events test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })
  const reference = '101110011'
  const url = `/api/application/events/${reference}`

  describe(`GET ${url} route`, () => {
    test('returns 200 with data', async () => {
      getApplicationEvents.mockResolvedValue(
        [{ Payload: '{"type":"claim-createdAt","message":"Session set for claim and createdAt.","data":{"createdAt":"2023-04-18T14:17:28.623Z"},"raisedBy":"1105110083@email.com","raisedOn":"2023-06-30T12:41:00.123Z"}', EventType: 'claim-createdAt', EventRaised: '2023-06-30T12:41:00.123Z' },
          { Payload: '{"type":"claim-claimed","message":"Session set for claim and claimed.","data":{"claimed":false},"raisedBy":"1105110083@email.com","raisedOn":"2023-06-30T12:142:00.456Z"}', EventType: 'claim-claimed', EventRaised: '2023-06-30T12:142:00.456Z' }]
      )
      const options = {
        method: 'GET',
        url: '/api/application/events/101110011'
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      const $ = JSON.parse(res.payload)
      expect($.eventRecords).not.toBeNull()
      expect($.eventRecords.length).toBe(2)
    })
    test('returns 200 with no data', async () => {
      getApplicationEvents.mockResolvedValue(null)
      const options = {
        method: 'GET',
        url: '/api/application/events/101110011'
      }
      const res = await server.inject(options)
      expect(res.statusCode).toBe(200)
      const $ = JSON.parse(res.payload)
      expect($.eventRecords).toBeNull()
    })
  })
})
