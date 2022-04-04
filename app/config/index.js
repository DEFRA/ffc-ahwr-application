const Joi = require('joi')
const uuidRegex = '[0-9a-f]{8}\\b-[0-9a-f]{4}\\b-[0-9a-f]{4}\\b-[0-9a-f]{4}\\b-[0-9a-f]{12}'
const msgTypePrefix = 'uk.gov.ffc.ahwr'
const notifyApiKeyRegex = new RegExp(`.*-${uuidRegex}-${uuidRegex}`)

const sharedConfigSchema = {
  appInsights: Joi.object(),
  host: Joi.string().default('localhost'),
  password: Joi.string(),
  username: Joi.string(),
  useCredentialChain: Joi.bool().default(false)
}
const schema = Joi.object({
  env: Joi.string().valid('development', 'test', 'production').default('development'),
  isDev: Joi.boolean().default(false),
  applicationRequestQueue: {
    address: Joi.string().default('applicationRequestQueue'),
    type: Joi.string(),
    ...sharedConfigSchema
  },
  applicationRequestMsgType: Joi.string(),
  applicationResponseQueue: {
    address: Joi.string().default('applicationResponseQueue'),
    type: Joi.string(),
    ...sharedConfigSchema
  },
  applicationResponseMsgType: Joi.string(),
  fetchApplicationRequestQueue: {
    address: Joi.string().default('fetchApplicationRequestQueue'),
    type: Joi.string(),
    ...sharedConfigSchema
  },
  fetchApplicationRequestMsgType: Joi.string(),
  fetchApplicationResponseQueue: {
    address: Joi.string().default('fetchApplicationResponseQueue'),
    type: Joi.string(),
    ...sharedConfigSchema
  },
  fetchApplicationResponseMsgType: Joi.string(),
  notify: {
    apiKey: Joi.string().pattern(notifyApiKeyRegex),
    templateIdApplicationComplete: Joi.string().uuid()
  }
})

const sharedConfig = {
  appInsights: require('applicationinsights'),
  host: process.env.MESSAGE_QUEUE_HOST,
  password: process.env.MESSAGE_QUEUE_PASSWORD,
  username: process.env.MESSAGE_QUEUE_USER,
  useCredentialChain: process.env.NODE_ENV === 'production'
}
const config = {
  env: process.env.NODE_ENV,
  isDev: process.env.NODE_ENV === 'development',
  applicationRequestQueue: {
    address: process.env.APPLICATIONREQUEST_QUEUE_ADDRESS,
    type: 'queue',
    ...sharedConfig
  },
  applicationRequestMsgType: `${msgTypePrefix}.app.request`,
  applicationResponseQueue: {
    address: process.env.APPLICATIONRESPONSE_QUEUE_ADDRESS,
    type: 'queue',
    ...sharedConfig
  },
  applicationResponseMsgType: `${msgTypePrefix}.app.response`,
  fetchApplicationRequestQueue: {
    address: process.env.FETCHAPPLICATIONREQUEST_QUEUE_ADDRESS,
    type: 'queue',
    ...sharedConfig
  },
  fetchApplicationRequestMsgType: `${msgTypePrefix}.fetch.app.request`,
  fetchApplicationResponseQueue: {
    address: process.env.FETCHAPPLICATIONRESPONSE_QUEUE_ADDRESS,
    type: 'queue',
    ...sharedConfig
  },
  fetchApplicationResponseMsgType: `${msgTypePrefix}.fetch.app.response`,
  notify: {
    apiKey: process.env.NOTIFY_API_KEY,
    templateIdApplicationComplete: process.env.NOTIFY_TEMPLATE_ID_APPLICATION_COMPLETE
  }
}

const { error, value } = schema.validate(config, { abortEarly: false })

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

module.exports = value
