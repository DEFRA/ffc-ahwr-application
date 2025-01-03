import { when, resetAllWhenMocks } from 'jest-when'
import {
  isTodayHoliday,
  set
} from '../../../../app/repositories/holiday-repository'
import { buildData } from '../../../../app/data'

jest.mock('../../../../app/data', () => {
  return {
    buildData: {
      models: {
        holiday: {
          upsert: jest.fn(),
          findOne: jest.fn()
        }

      }
    }
  }
})

describe('holiday repository test', () => {
  const env = process.env

  afterEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    resetAllWhenMocks()
    process.env = { ...env }
  })

  test('should create or update holiday', async () => {
    const aDate = new Date().toISOString().split('T')[0]
    await set(aDate, 'a holiday')

    const entry = {
      date: aDate,
      description: 'a holiday'
    }

    expect(buildData.models.holiday.upsert).toHaveBeenCalledTimes(1)
    expect(buildData.models.holiday.upsert).toHaveBeenCalledWith(entry)
  })

  test('Should return false', async () => {
    when(buildData.models.holiday.findOne)
      .calledWith({ where: { date: new Date().toISOString().split('T')[0] } })
      .mockResolvedValue(null)

    expect(await isTodayHoliday()).toBeFalsy()
  })

  test('Should return true', async () => {
    when(buildData.models.holiday.findOne)
      .calledWith({ where: { date: new Date().toISOString().split('T')[0] } })
      .mockResolvedValue({ valid: 'date' })

    expect(await isTodayHoliday()).toBeTruthy()
  })
})
