import { isTodayHoliday } from '../../repositories/holiday-repository.js'

export const holidayHandlers = [
  {
    method: 'GET',
    path: '/api/holidays/isTodayHoliday',
    handler: async (request, h) => {
      return await isTodayHoliday() ? h.response().code(200) : h.response().code(404)
    }
  }
]
