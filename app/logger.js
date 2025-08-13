import pino from 'hapi-pino'

const transport = {
  target: 'pino-pretty',
  options: {
    singleLine: true,
    colorize: true
  }
}
const testLevel = { level: 'silent' }

const req = (request) => ({
  id: request.id,
  method: request.method,
  url: request.url
})

const res = (response) => ({
  statusCode: response.statusCode
})

const err = (error) => ({
  type: error.type,
  name: error.name,
  message: error.message,
  isBoom: error.isBoom,
  isServer: error.isServer,
  payload: error.payload,
  stack: error.stack,
  data: {
    isResponseError: error?.data?.isResponseError,
    payload: error?.data?.payload
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
    ignorePaths: ['/healthy', '/healthz'],
    serializers: {
      req,
      res,
      err
    },
    ...(process.env.USE_PRETTY_PRINT === 'true' && { transport }),
    redact: ['payload.vetsName', 'payload.vetRCVSNumber']
  }
}
