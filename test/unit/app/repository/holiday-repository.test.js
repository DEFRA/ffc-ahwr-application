const { when, resetAllWhenMocks } = require('jest-when')
const repository = require('../../../../app/repositories/holiday-repository')
const data = require('../../../../app/data').default

jest.mock('../../../../app/data')

data.models.holiday.findOne = jest.fn()
data.models.holiday.upsert = jest.fn()

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
    await repository.set(aDate, 'a holiday')

    const entry = {
      date: aDate,
      description: 'a holiday'
    }

    expect(data.models.holiday.upsert).toHaveBeenCalledTimes(1)
    expect(data.models.holiday.upsert).toHaveBeenCalledWith(entry)
  })

  test('Should return false', async () => {
    when(data.models.holiday.findOne)
      .calledWith({ where: { date: new Date().toISOString().split('T')[0] } })
      .mockResolvedValue(null)

    expect(await repository.IsTodayHoliday()).toBeFalsy()
  })

  test('Should return true', async () => {
    when(data.models.holiday.findOne)
      .calledWith({ where: { date: new Date().toISOString().split('T')[0] } })
      .mockResolvedValue({ valid: 'date' })

    expect(await repository.IsTodayHoliday()).toBeTruthy()
  })
})
