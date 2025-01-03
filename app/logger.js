import pino from 'hapi-pino'

const transport = { target: 'pino-pretty' }
const testLevel = { level: 'silent' }

const req = (req) => ({
  id: req.id,
  method: req.method,
  url: req.url
})

const res = (res) => ({
  statusCode: res.statusCode
})

const err = (err) => ({
  type: err.type,
  name: err.name,
  message: err.message,
  isBoom: err.isBoom,
  isServer: err.isServer,
  payload: err.payload,
  stack: err.stack,
  data: {
    isResponseError: err?.data?.isResponseError,
    payload: err?.data?.payload
  }
})

export const logger = {
  plugin: pino,
  options: {
    name: 'ffc-ahwr-application',
    ...(process.env.NODE_ENV === 'test' && testLevel),
    formatters: {
      level: (level) => ({ level })
    },
    serializers: {
      req,
      res,
      err
    },
    ...(process.env.USE_PRETTY_PRINT === 'true' && { transport })
  }
}
