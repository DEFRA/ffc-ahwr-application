const Joi = require('joi')
const notifyConfig = require('./notify')
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
  backOfficeRequestQueue: {
    address: Joi.string().default('backOfficeRequestQueue'),
    type: Joi.string(),
    ...sharedConfigSchema
  },
  backOfficeRequestMsgType: Joi.string(),
  getBackOfficeApplicationRequestMsgType: Joi.string(),
  backOfficeResponseQueue: {
    address: Joi.string().default('backOfficeResponseQueue'),
    type: Joi.string(),
    ...sharedConfigSchema
  },
  backOfficeResponseMsgType: Joi.string(),
  getBackOfficeApplicationResponseMsgType: Joi.string(),
  env: Joi.string().valid('development', 'test', 'production').default('development'),
  fetchApplicationRequestMsgType: Joi.string(),
  fetchApplicationResponseMsgType: Joi.string(),
  fetchClaimRequestMsgType: Joi.string(),
  fetchClaimResponseMsgType: Joi.string(),
  isDev: Joi.boolean().default(false),
  paymentRequestTopic: {
    address: Joi.string().default('paymentRequestTopic'),
    ...sharedConfigSchema
  },
  paymentResponseSubscription: {
    topic: Joi.string().default('paymentResponseTopic'),
    address: Joi.string().default('paymentResponseSubscription'),
    type: Joi.string().default('subscription'),
    ...sharedConfigSchema
  },
  sendPaymentRequest: Joi.boolean().default(true),
  serviceUri: Joi.string().uri(),
  storage: {
    connectionString: Joi.string().required(),
    usersContainer: Joi.string().default('users'),
    usersFile: Joi.string().default('users.json'),
    storageAccount: Joi.string().required(),
    useConnectionString: Joi.bool().default(true)
  },
  submitClaimRequestMsgType: Joi.string(),
  submitClaimResponseMsgType: Joi.string(),
  submitPaymentRequestMsgType: Joi.string(),
  vetVisitRequestMsgType: Joi.string(),
  vetVisitResponseMsgType: Joi.string()
})

const sharedConfig = {
  appInsights: require('applicationinsights'),
  host: process.env.MESSAGE_QUEUE_HOST,
  password: process.env.MESSAGE_QUEUE_PASSWORD,
  username: process.env.MESSAGE_QUEUE_USER,
  useCredentialChain: process.env.NODE_ENV === 'production'
}
const config = {
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
  backOfficeRequestQueue: {
    address: process.env.BACKOFFICEREQUEST_QUEUE_ADDRESS,
    type: 'queue',
    ...sharedConfig
  },
  backOfficeRequestMsgType: `${msgTypePrefix}.backoffice.request`,
  getBackOfficeApplicationRequestMsgType: `${msgTypePrefix}.get.application.backoffice.request`,
  backOfficeResponseQueue: {
    address: process.env.BACKOFFICERESPONSE_QUEUE_ADDRESS,
    type: 'queue',
    ...sharedConfig
  },
  backOfficeResponseMsgType: `${msgTypePrefix}.backoffice.response`,
  getBackOfficeApplicationResponseMsgType: `${msgTypePrefix}.get.application.backoffice.response`,
  env: process.env.NODE_ENV,
  fetchApplicationRequestMsgType: `${msgTypePrefix}.fetch.app.request`,
  fetchApplicationResponseMsgType: `${msgTypePrefix}.fetch.app.response`,
  fetchClaimRequestMsgType: `${msgTypePrefix}.fetch.claim.request`,
  fetchClaimResponseMsgType: `${msgTypePrefix}.fetch.claim.response`,
  isDev: process.env.NODE_ENV === 'development',
  paymentRequestTopic: {
    address: process.env.PAYMENTREQUEST_TOPIC_ADDRESS,
    ...sharedConfig
  },
  paymentResponseSubscription: {
    topic: process.env.PAYMENTRESPONSE_TOPIC_ADDRESS,
    address: process.env.PAYMENTRESPONSE_SUBSCRIPTION_ADDRESS,
    type: 'subscription',
    ...sharedConfig
  },
  sendPaymentRequest: process.env.SEND_PAYMENT_REQUEST,
  serviceUri: process.env.SERVICE_URI,
  storage: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    useConnectionString: process.env.AZURE_STORAGE_USE_CONNECTION_STRING,
    storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME
  },
  submitClaimRequestMsgType: `${msgTypePrefix}.submit.claim.request`,
  submitClaimResponseMsgType: `${msgTypePrefix}.submit.claim.response`,
  submitPaymentRequestMsgType: `${msgTypePrefix}.submit.payment.request`,
  vetVisitRequestMsgType: `${msgTypePrefix}.vet.visit.request`,
  vetVisitResponseMsgType: `${msgTypePrefix}.vet.visit.response`
}

const { error, value } = schema.validate(config, { abortEarly: false })

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

value.notify = notifyConfig

module.exports = value
