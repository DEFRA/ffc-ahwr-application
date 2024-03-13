const { IsTodayHoliday } = require('../../repositories/holiday-repository')

module.exports = [
  {
    method: 'GET',
    path: '/api/holidays/isTodayHoliday',
    handler: async (request, h) => {
      return await IsTodayHoliday() ? h.response().code(200) : h.response().code(404)
    }
  }
]
