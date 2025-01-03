import { when, resetAllWhenMocks } from 'jest-when'
import { getAll, getByApplicationReference, getById, set, update } from '../../../../app/repositories/stage-execution-repository'
import { buildData } from '../../../../app/data'
import { stageExecutionActions } from '../../../../app/constants'

jest.mock('../../../../app/data', () => {
  return {
    buildData: {
      models: {
        stage_execution: {
          findAll: jest.fn(),
          findOne: jest.fn(),
          create: jest.fn(),
          update: jest.fn()
        }

      }
    }
  }
})

const MOCK_NOW = new Date()

const mockData = {
  id: 123,
  dataValues: {
    action: {
      action: 'action'
    }
  }
}

describe('Stage Exection Repository test', () => {
  const env = process.env

  beforeAll(() => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(MOCK_NOW)
  })

  afterEach(() => {
    jest.clearAllMocks()
    resetAllWhenMocks()
    process.env = { ...env }
  })

  test('Get all stage execution data', async () => {
    when(buildData.models.stage_execution.findAll)
      .calledWith()
      .mockResolvedValue(mockData)

    await getAll()

    expect(buildData.models.stage_execution.findAll).toHaveBeenCalledTimes(1)
    expect(buildData.models.stage_execution.findAll).toHaveBeenCalledWith()
  })

  test('Get by id', async () => {
    when(buildData.models.stage_execution.findOne)
      .calledWith(1)
      .mockResolvedValue(mockData)

    await getById(1)

    expect(buildData.models.stage_execution.findOne).toHaveBeenCalledTimes(1)
    expect(buildData.models.stage_execution.findOne).toHaveBeenCalledWith({ where: { id: 1 } })
  })

  test('Get by application', async () => {
    when(buildData.models.stage_execution.findAll)
      .calledWith('AHWR-0000-0000')
      .mockResolvedValue(mockData)

    await getByApplicationReference('AHWR-0000-0000')

    expect(buildData.models.stage_execution.findAll).toHaveBeenCalledTimes(1)
    expect(buildData.models.stage_execution.findAll).toHaveBeenCalledWith({ where: { applicationReference: 'AHWR-0000-0000' } })
  })

  test.each([
    {
      mockData: {
        id: 123,
        dataValues: {
          action: {
            action: stageExecutionActions.recommendToPay
          }
        }
      }
    },
    {
      mockData: {
        id: 123,
        dataValues: {
          action: {
            action: stageExecutionActions.recommendToReject
          }
        }
      }
    },
    {
      mockData: {
        id: 123,
        dataValues: {
          action: {
            action: stageExecutionActions.authorisePayment
          }
        }
      }
    },
    {
      mockData: {
        id: 123,
        dataValues: {
          action: {
            action: stageExecutionActions.authoriseRejection
          }
        }
      }
    }
  ])('Set creates record for data', async (testCase) => {
    when(buildData.models.stage_execution.create)
      .calledWith(testCase.mockData)
      .mockResolvedValue(testCase.mockData)

    await set(testCase.mockData)

    expect(buildData.models.stage_execution.create).toHaveBeenCalledTimes(1)
    expect(buildData.models.stage_execution.create).toHaveBeenCalledWith(testCase.mockData)
  })

  test('Update record for data', async () => {
    when(buildData.models.stage_execution.update)
      .calledWith(
        { processedAt: MOCK_NOW },
        {
          where: { id: mockData.id },
          returning: true
        }
      )
      .mockResolvedValue([
        1,
        mockData
      ])

    await update(mockData)

    expect(buildData.models.stage_execution.update).toHaveBeenCalledTimes(1)
    expect(buildData.models.stage_execution.update).toHaveBeenCalledWith(
      { processedAt: MOCK_NOW },
      {
        where: { id: mockData.id },
        returning: true
      }
    )
  })
})
