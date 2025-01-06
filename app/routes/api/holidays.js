import { isTodayHoliday } from '../../repositories/holiday-repository.js'

export const holidayHandlers = [
  {
    method: 'GET',
    path: '/api/holidays/isTodayHoliday',
    handler: async (request, h) => {
      const isHoliday = await isTodayHoliday()

      if (isHoliday) {
        return h.response().code(200)
      }

      return h.response().code(404)
    }
  }
]
