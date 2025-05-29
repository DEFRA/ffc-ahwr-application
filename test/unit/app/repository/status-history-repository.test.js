import { when, resetAllWhenMocks } from 'jest-when'
import { buildData } from '../../../../app/data'
import { createStatusHistory, getHistoryByReference } from '../../../../app/repositories/status-history-repository.js'

jest.mock('../../../../app/data', () => {
  return {
    buildData: {
      models: {
        status_history: {
          findAll: jest.fn(),
          create: jest.fn()
        }
      }
    }
  }
})

describe('Status history repository', () => {
  const env = process.env

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    resetAllWhenMocks()
    process.env = { ...env }
  })

  test('Should create status history', async () => {
    const statusHistoryData = {
      reference: 'AHWR-9049-6416',
      note: 'hi',
      statusId: '1',
      createdBy: 'admin',
      createdAt: '2024-04-14T20:43:15.599Z'
    }

    await createStatusHistory(statusHistoryData)

    expect(buildData.models.status_history.create).toHaveBeenCalledTimes(1)
    expect(buildData.models.status_history.create).toHaveBeenCalledWith(statusHistoryData)
  })

  test('Get all status history by reference', async () => {
    const reference = 'AHWR-0AD3-3322'

    const statusHistory = [
      {
        id: 'ce758b2c-5e2c-4957-9864-ebc4451f6b1f',
        reference: 'AHWR-9049-6416',
        note: 'hi',
        statusId: '1',
        createdAt: '2024-04-14T20:00:46.045Z',
        createdBy: 'admin'
      },
      {
        id: 'c528abb9-7d1a-4617-ae00-9db08d072e86',
        reference: 'AHWR-9049-6416',
        note: 'hello',
        statusId: '2',
        createdAt: '2024-04-12T14:54:55.893Z',
        createdBy: 'admin'
      }]

    when(buildData.models.status_history.findAll)
      .calledWith({
        where: { reference }
      })
      .mockResolvedValue(statusHistory)

    const result = await getHistoryByReference(
      reference
    )

    expect(statusHistory).toEqual(result)
  })
})
