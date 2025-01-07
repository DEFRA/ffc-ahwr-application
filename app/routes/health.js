export const healthHandlers = [
  {
    method: 'GET',
    path: '/healthy',
    handler: (_request, h) => {
      return h.response('ok').code(200)
    }
  },
  {
    method: 'GET',
    path: '/healthz',
    handler: (request, h) => {
      return h.response('ok').code(200)
    }
  }
]
