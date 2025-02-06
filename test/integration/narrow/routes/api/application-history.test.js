import { server } from '../../../../../app/server'
import { getApplicationHistory } from '../../../../../app/azure-storage/application-status-repository'

jest.mock('../../../../../app/azure-storage/application-status-repository')

describe('Application history test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('returns historyRecords', async () => {
    const historyRecords = [
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

    getApplicationHistory.mockResolvedValue(historyRecords)

    const options = {
      method: 'GET',
      url: '/api/application/history/AHWR-7C72-8871'
    }
    const res = await server.inject(options)

    expect(JSON.parse(res.payload)).toEqual({ historyRecords })
  })
})
