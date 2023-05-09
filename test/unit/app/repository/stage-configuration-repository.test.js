const { when, resetAllWhenMocks } = require('jest-when')
const repository = require('../../../../app/repositories/stage-configuration-repository')
const data = require('../../../../app/data')

jest.mock('../../../../app/data')

data.models.stage_configuration.findAll = jest.fn()

const MOCK_NOW = new Date()

const mockData = {
  id: 123
}

describe('Stage Configuration Repository test', () => {
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
    when(data.models.stage_configuration.findAll)
      .calledWith()
      .mockResolvedValue(mockData)

    await repository.getAll()

    expect(data.models.stage_configuration.findAll).toHaveBeenCalledTimes(1)
    expect(data.models.stage_configuration.findAll).toHaveBeenCalledWith()
  })
})
