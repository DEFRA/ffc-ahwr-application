import { StatusCodes } from 'http-status-codes'

export const healthHandlers = [
  {
    method: 'GET',
    path: '/healthy',
    handler: (_request, h) => {
      return h.response('ok').code(StatusCodes.OK)
    }
  },
  {
    method: 'GET',
    path: '/healthz',
    handler: (request, h) => {
      return h.response('ok').code(StatusCodes.OK)
    }
  }
]
