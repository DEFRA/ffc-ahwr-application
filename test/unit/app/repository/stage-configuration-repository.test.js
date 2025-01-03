import {
  getAll,
  getById
} from '../../../../app/repositories/stage-configuration-repository'
import { buildData } from '../../../../app/data'

jest.mock('../../../../app/data', () => {
  return {
    buildData: {
      models: {
        stage_configuration: {
          findAll: jest.fn(),
          findOne: jest.fn()
        }

      }
    }
  }
})

const MOCK_NOW = new Date()

describe('Stage Configuration Repository test', () => {
  const env = process.env

  beforeAll(() => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(MOCK_NOW)
  })

  afterEach(() => {
    jest.clearAllMocks()
    process.env = { ...env }
  })

  test('Get all stage configuration data', async () => {
    await getAll()

    expect(
      buildData.models.stage_configuration.findAll
    ).toHaveBeenCalledTimes(1)
    expect(
      buildData.models.stage_configuration.findAll
    ).toHaveBeenCalledWith()
  })

  test('Get all stage configuration data', async () => {
    await getById(1)

    expect(
      buildData.models.stage_configuration.findOne
    ).toHaveBeenCalledTimes(1)
    expect(
      buildData.models.stage_configuration.findOne
    ).toHaveBeenCalledWith({ where: { id: 1 } })
  })
})
