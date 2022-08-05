const { userSearchPayload } = require('./payload')
const { userSearchResponseSchema } = require('./schema')

const { getUsers } = require('../../lib/get-users')

module.exports = [{
  method: 'POST',
  path: '/api/user/search',
  options: {
    validate: {
      payload: userSearchPayload,
      failAction: async (_request, h, err) => {
        return h.response({ err }).code(400).takeover()
      }
    },
    response: {
      status: {
        200: userSearchResponseSchema
      }
    },
    handler: async (request, h) => {
      const users = await getUsers(request.payload)
      return h.response(users).code(200)
    }
  }
}]
