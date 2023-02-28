const Joi = require('joi')

module.exports = [
  {
    method: 'GET',
    path: '/api/application/history/{ref}',
    options: {
      validate: {
        params: Joi.object({
          ref: Joi.string().valid()
        })
      },
      handler: async (request, h) => {
        const historyRecords = [{ date: '23/03/2023', time: '10:00:12', statusId: 9, user: 'Daniel Jones' },
          { date: '24/03/2023', time: '09:30:00', statusId: 2, user: 'Daniel Jones' },
          { date: '25/03/2023', time: '11:10:15', statusId: 10, user: 'Amanda Hassan' }]
        if (historyRecords) {
          return h.response({ historyRecords }).code(200)
        } else {
          return h.response('Not Found').code(404).takeover()
        }
      }
    }
  }
]
