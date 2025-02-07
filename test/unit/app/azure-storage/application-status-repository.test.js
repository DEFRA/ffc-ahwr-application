import { getApplicationHistory } from '../../../../app/azure-storage/application-status-repository'
import { queryEntitiesByPartitionKey } from '../../../../app/azure-storage/query-entities'

jest.mock('../../../../app/azure-storage/query-entities')

describe('Application Status Repository test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getApplicationHistory - application history found', async () => {
    const events = [
      {
        ChangedOn: '2023-03-23T10:00:12.000Z',
        Payload: '{\n  "reference": "AHWR-7C72-8871",\n  "statusId": 91\n}',
        ChangedBy: 'Daniel Jones'
      },
      {
        ChangedOn: '2023-03-24T09:30:00.000Z',
        Payload: '{\n  "reference": "AHWR-7C72-8871",\n  "statusId": 2\n}',
        ChangedBy: 'Daniel Jones'
      },
      {
        ChangedOn: '2023-03-25T11:10:15:12.000Z',
        Payload: '{\n  "reference": "AHWR-7C72-8871",\n  "statusId": 10\n}',
        ChangedBy: 'Amanda Hassan'
      }
    ]
    queryEntitiesByPartitionKey.mockResolvedValueOnce(events)

    const result = await getApplicationHistory('AHWR-7C72-8871')

    expect(result).toEqual(events)
  })
})
