const repository = require('../../../../app/azure-storage/application-eventstore-repository')
const queryEntities = require('../../../../app/azure-storage/query-entities')
jest.mock('../../../../app/azure-storage/query-entities')

describe('Application Event Store Repository test', () => {
  const reference = 'ABC-1234'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getApplicationEvents ', () => {
    test('getApplicationEvents - application events found', async () => {
      queryEntities.mockResolvedValue(
        [{ Payload: '{"type":"claim-createdAt","message":"Session set for claim and createdAt.","data":{"createdAt":"2023-04-18T14:17:28.623Z"},"raisedBy":"1105110083@email.com","raisedOn":"2023-06-30T12:41:00.123Z"}', EventType: 'claim-createdAt', EventRaised: '2023-06-30T12:41:00.123Z' },
          { Payload: '{"type":"claim-claimed","message":"Session set for claim and claimed.","data":{"claimed":false},"raisedBy":"1105110083@email.com","raisedOn":"2023-06-30T12:142:00.456Z"}', EventType: 'claim-claimed', EventRaised: '2023-06-30T12:142:00.456Z' }])
      const result = await repository.getApplicationEvents(reference)

      expect(queryEntities).toHaveBeenCalledTimes(1)
      expect(result).not.toBeNull()
      expect(result.length).toBe(2)
    })
    test('getApplicationEvents - application events not found', async () => {
      queryEntities.mockResolvedValue([])
      const result = await repository.getApplicationEvents(reference)

      expect(queryEntities).toHaveBeenCalledTimes(1)
      expect(result).toBeNull()
    })
  })
})
