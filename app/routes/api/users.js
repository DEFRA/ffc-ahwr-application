const { userSearchPayload } = require('./schema/payload')
const { userSearchResponseSchema } = require('./schema/schema')

const { getUsers } = require('../../lib/get-users')

module.exports = [{
  method: 'POST',
  path: '/api/user/search',
  options: {
    validate: {
      payload: userSearchPayload,
      failAction: async (_request, h, err) =>
        h.response({ err }).code(400).takeover()
    },
    response: {
      status: {
        200: userSearchResponseSchema
      }
    },
    handler: async (request, h) =>
      h.response(await getUsers(request.payload)).code(200)
  }
}]
