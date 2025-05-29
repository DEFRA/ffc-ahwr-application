import { getApplicationHistory } from '../../../../app/azure-storage/application-status-repository'
import { queryEntitiesByPartitionKey } from '../../../../app/azure-storage/query-entities'
import { config } from '../../../../app/config/index.js'
import { getHistoryByReference } from '../../../../app/repositories/status-history-repository.js'

jest.mock('../../../../app/azure-storage/query-entities')

jest.mock('../../../../app/repositories/status-history-repository')

describe('Application Status Repository test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    config.storeHistoryInDb.enabled = false
  })

  test('getApplicationHistory - application history found from azure storage when store in DB disabled', async () => {
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

  test('getApplicationHistory - application history found from DB when store in DB enabled', async () => {
    config.storeHistoryInDb.enabled = true
    const events = [
      {
        dataValues: {
          reference: 'AHWR-7C72-8871',
          statusId: 91,
          note: 'Initial status',
          createdAt: '2023-03-23T10:00:12.000Z',
          createdBy: 'Daniel Jones'
        }
      },
      {
        dataValues: {
          reference: 'AHWR-7C72-8871',
          statusId: 2,
          note: 'Status updated',
          createdAt: '2023-03-24T09:30:00.000Z',
          createdBy: 'Daniel Jones'
        }
      }
    ]
    getHistoryByReference.mockResolvedValueOnce(events)

    const result = await getApplicationHistory('AHWR-7C72-8871')

    expect(result).toEqual([
      {
        Payload: JSON.stringify({
          reference: 'AHWR-7C72-8871',
          statusId: 91,
          note: 'Initial status',
          createdAt: '2023-03-23T10:00:12.000Z',
          createdBy: 'Daniel Jones'
        })
      },
      {
        Payload: JSON.stringify({
          reference: 'AHWR-7C72-8871',
          statusId: 2,
          note: 'Status updated',
          createdAt: '2023-03-24T09:30:00.000Z',
          createdBy: 'Daniel Jones'
        })
      }
    ])
  })
})
