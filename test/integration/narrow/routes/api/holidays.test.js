const holidaysRepository = require('../../../../../app/repositories/holiday-repository')

jest.mock('../../../../../app/repositories/holiday-repository')

describe('holidays end point', () => {
  const server = require('../../../../../app/server')

  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('return 200 code when itis a holiday', async () => {
    holidaysRepository.IsTodayHoliday.mockResolvedValue(true)

    const res = await server.inject({
      method: 'GET',
      url: '/api/holidays/isTodayHoliday'
    })

    expect(res.statusCode).toBe(200)
    expect(holidaysRepository.IsTodayHoliday).toHaveBeenCalledTimes(1)
  })

  test('return 404 code when it is not a holiday', async () => {
    holidaysRepository.IsTodayHoliday.mockResolvedValue(false)

    const res = await server.inject({
      method: 'GET',
      url: '/api/holidays/isTodayHoliday'
    })

    expect(res.statusCode).toBe(404)
    expect(holidaysRepository.IsTodayHoliday).toHaveBeenCalledTimes(1)
  })
})
