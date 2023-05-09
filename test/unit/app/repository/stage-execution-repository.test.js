const { when, resetAllWhenMocks } = require('jest-when')
const repository = require('../../../../app/repositories/stage-execution-repository')
const data = require('../../../../app/data')

jest.mock('../../../../app/data')

data.models.stage_execution.create = jest.fn()
data.models.stage_execution.update = jest.fn()
data.models.stage_execution.findAll = jest.fn()

const MOCK_NOW = new Date()

const mockData = {
  id: 123
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

  test('Set creates record for data', async () => {
    when(data.models.stage_execution.create)
      .calledWith(mockData)
      .mockResolvedValue(mockData)

    await repository.set(mockData)

    expect(data.models.stage_execution.create).toHaveBeenCalledTimes(1)
    expect(data.models.stage_execution.create).toHaveBeenCalledWith(mockData)
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