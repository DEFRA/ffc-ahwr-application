const { when, resetAllWhenMocks } = require('jest-when')
const repository = require('../../../../app/repositories/stage-execution-repository')
const data = require('../../../../app/data')
const eventPublisher = require('../../../../app/event-publisher')

jest.mock('../../../../app/data')
jest.mock('../../../../app/event-publisher')

data.models.stage_execution.create = jest.fn()
data.models.stage_execution.update = jest.fn()
data.models.stage_execution.findAll = jest.fn()

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

  test('Application Repository returns Function', () => {
    expect(repository).toBeDefined()
  })

  test('Get all stage execution data', async () => {
    when(data.models.stage_execution.findAll)
      .calledWith()
      .mockResolvedValue(mockData)

    await repository.getAll()

    expect(data.models.stage_execution.findAll).toHaveBeenCalledTimes(1)
    expect(data.models.stage_execution.findAll).toHaveBeenCalledWith()
  })

  test('Get by id', async () => {
    when(data.models.stage_execution.findOne)
      .calledWith(1)
      .mockResolvedValue(mockData)

    await repository.getById(1)

    expect(data.models.stage_execution.findOne).toHaveBeenCalledTimes(1)
    expect(data.models.stage_execution.findOne).toHaveBeenCalledWith({ where: { id: 1 } })
  })

  test('Get by application', async () => {
    when(data.models.stage_execution.findAll)
      .calledWith('AHWR-0000-0000')
      .mockResolvedValue(mockData)

    await repository.getByApplicationReference('AHWR-0000-0000')

    expect(data.models.stage_execution.findAll).toHaveBeenCalledTimes(1)
    expect(data.models.stage_execution.findAll).toHaveBeenCalledWith({ where: { applicationReference: 'AHWR-0000-0000' } })
  })

  test('Set creates record for data', async () => {
    when(data.models.stage_execution.create)
      .calledWith(mockData)
      .mockResolvedValue(mockData)

    await repository.set(mockData)

    expect(data.models.stage_execution.create).toHaveBeenCalledTimes(1)
    expect(data.models.stage_execution.create).toHaveBeenCalledWith(mockData)
    expect(eventPublisher.raise).toHaveBeenCalledTimes(1)
  })

  test('Update record for data', async () => {
    when(data.models.stage_execution.update)
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

    await repository.update(mockData)

    expect(data.models.stage_execution.update).toHaveBeenCalledTimes(1)
    expect(data.models.stage_execution.update).toHaveBeenCalledWith(
      { processedAt: MOCK_NOW },
      {
        where: { id: mockData.id },
        returning: true
      }
    )
  })
})
