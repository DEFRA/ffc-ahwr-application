import { server } from '../../../../../app/server'
import { getApplicationHistory } from '../../../../../app/azure-storage/application-status-repository'
import { findAllClaimUpdateHistory } from '../../../../../app/repositories/claim-repository'

jest.mock('../../../../../app/azure-storage/application-status-repository')
jest.mock('../../../../../app/repositories/claim-repository')

describe('Application history test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('returns historyRecords', async () => {
    const statusHistory = [
      {
        EventType: 'status-updated',
        Payload: '{\n  "note": "in check",\n "reference": "AHWR-7C72-8871",\n  "statusId": 5\n}',
        ChangedBy: 'Daniel Jones',
        ChangedOn: '2023-03-23T10:00:12.000Z'
      },
      {
        EventType: 'status-updated',
        ChangedOn: '2023-03-25T11:10:15:12.000Z',
        Payload: '{\n "note": "rejected",\n "reference": "AHWR-7C72-8871",\n  "statusId": 10\n}',
        ChangedBy: 'Amanda Hassan'
      }
    ]

    const updateHistory = [
      {
        dataValues: {
          applicationReference: 'AHWR-209E-ED2E',
          reference: 'AHWR-209E-ED2E',
          note: 'test',
          updatedProperty: 'visitDate',
          newValue: '2025-03-03T00:00:00.000Z',
          oldValue: '2025-03-18T00:00:00.000Z',
          eventType: 'application-visitDate',
          createdAt: new Date('2023/03/24'),
          createdBy: 'Mr Test'
        }
      }
    ]

    getApplicationHistory.mockResolvedValue(statusHistory)
    findAllClaimUpdateHistory.mockResolvedValue(updateHistory)
    const options = {
      method: 'GET',
      url: '/api/application/history/AHWR-7C72-8871'
    }
    const res = await server.inject(options)

    const historyRecords = [
      {
        eventType: 'status-updated',
        newValue: 5,
        note: 'in check',
        updatedAt: '2023-03-23T10:00:12.000Z',
        updatedBy: 'Daniel Jones',
        updatedProperty: 'statusId'
      },
      {
        eventType: 'status-updated',
        newValue: 10,
        note: 'rejected',
        updatedAt: '2023-03-25T11:10:15:12.000Z',
        updatedBy: 'Amanda Hassan',
        updatedProperty: 'statusId'
      },
      {
        eventType: 'application-visitDate',
        newValue: '2025-03-03T00:00:00.000Z',
        note: 'test',
        oldValue: '2025-03-18T00:00:00.000Z',
        updatedAt: '2023-03-24T00:00:00.000Z',
        updatedBy: 'Mr Test',
        updatedProperty: 'visitDate'
      }
    ]

    expect(JSON.parse(res.payload)).toEqual({ historyRecords })
  })
})
