const repository = require('../../../../app/azure-storage/application-status-repository')
const queryEntities = require('../../../../app/azure-storage/query-entities')
jest.mock('../../../../app/azure-storage/query-entities')

describe('Application Status Repository test', () => {
  const reference = 'ABC-1234'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getApplicationHistory ', () => {
    test('getApplicationHistory - application history found', async () => {
      queryEntities.mockResolvedValue(
        [{ ChangedOn: '2023-03-23T10:00:12.000Z', Payload: '{\n  "reference": "AHWR-7C72-8871",\n  "statusId": 91\n}', ChangedBy: 'Daniel Jones' },
          { ChangedOn: '2023-03-24T09:30:00.000Z', Payload: '{\n  "reference": "AHWR-7C72-8871",\n  "statusId": 2\n}', ChangedBy: 'Daniel Jones' },
          { ChangedOn: '2023-03-25T11:10:15:12.000Z', Payload: '{\n  "reference": "AHWR-7C72-8871",\n  "statusId": 10\n}', ChangedBy: 'Amanda Hassan' }])
      const result = await repository.getApplicationHistory(reference)

      expect(queryEntities).toHaveBeenCalledTimes(1)
      expect(result).not.toBeNull()
      expect(result.length).toBe(3)
    })
    test('getApplicationHistory - application history not found', async () => {
      queryEntities.mockResolvedValue([])
      const result = await repository.getApplicationHistory(reference)

      expect(queryEntities).toHaveBeenCalledTimes(1)
      expect(result).toBeNull()
    })
  })
})
