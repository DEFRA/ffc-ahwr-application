import { isTodayHoliday } from '../../repositories/holiday-repository.js'
import { StatusCodes } from 'http-status-codes'

export const holidayHandlers = [
  {
    method: 'GET',
    path: '/api/holidays/isTodayHoliday',
    handler: async (_request, h) => {
      const isHoliday = await isTodayHoliday()

      if (isHoliday) {
        return h.response().code(StatusCodes.OK)
      }

      return h.response().code(StatusCodes.NOT_FOUND)
    }
  }
]
