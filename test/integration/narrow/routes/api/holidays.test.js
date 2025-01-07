import { isTodayHoliday } from '../../../../../app/repositories/holiday-repository'
import { server } from '../../../../../app/server'

jest.mock('../../../../../app/repositories/holiday-repository')

describe('holidays end point', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    await server.start()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('return 200 code when itis a holiday', async () => {
    isTodayHoliday.mockResolvedValue(true)

    const res = await server.inject({
      method: 'GET',
      url: '/api/holidays/isTodayHoliday'
    })

    expect(res.statusCode).toBe(200)
    expect(isTodayHoliday).toHaveBeenCalledTimes(1)
  })

  test('return 404 code when it is not a holiday', async () => {
    isTodayHoliday.mockResolvedValue(false)

    const res = await server.inject({
      method: 'GET',
      url: '/api/holidays/isTodayHoliday'
    })

    expect(res.statusCode).toBe(404)
    expect(isTodayHoliday).toHaveBeenCalledTimes(1)
  })
})
