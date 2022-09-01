const Joi = require('joi')
const notifyConfig = require('./notify')
const messageQueueConfig = require('./message-queue')
const msgTypePrefix = 'uk.gov.ffc.ahwr'

const schema = Joi.object({
  env: Joi.string().valid('development', 'test', 'production').default('development'),
  isDev: Joi.boolean().default(false),
  serviceUri: Joi.string().uri(),
  applicationRequestMsgType: Joi.string(),
  applicationResponseMsgType: Joi.string(),
  fetchApplicationRequestMsgType: Joi.string(),
  fetchApplicationResponseMsgType: Joi.string(),
  fetchClaimRequestMsgType: Joi.string(),
  fetchClaimResponseMsgType: Joi.string(),
  submitClaimRequestMsgType: Joi.string(),
  submitClaimResponseMsgType: Joi.string(),
  vetVisitRequestMsgType: Joi.string(),
  vetVisitResponseMsgType: Joi.string(),
  storage: {
    connectionString: Joi.string().required(),
    usersContainer: Joi.string().default('users'),
    usersFile: Joi.string().default('users.json'),
    storageAccount: Joi.string().required(),
    useConnectionString: Joi.bool().default(true)
  }
})

const config = {
  env: process.env.NODE_ENV,
  isDev: process.env.NODE_ENV === 'development',
  serviceUri: process.env.SERVICE_URI,
  applicationRequestMsgType: `${msgTypePrefix}.app.request`,
  applicationResponseMsgType: `${msgTypePrefix}.app.response`,
  fetchApplicationRequestMsgType: `${msgTypePrefix}.fetch.app.request`,
  fetchApplicationResponseMsgType: `${msgTypePrefix}.fetch.app.response`,
  fetchClaimRequestMsgType: `${msgTypePrefix}.fetch.claim.request`,
  fetchClaimResponseMsgType: `${msgTypePrefix}.fetch.claim.response`,
  submitClaimRequestMsgType: `${msgTypePrefix}.submit.claim.request`,
  submitClaimResponseMsgType: `${msgTypePrefix}.submit.claim.response`,
  vetVisitRequestMsgType: `${msgTypePrefix}.vet.visit.request`,
  vetVisitResponseMsgType: `${msgTypePrefix}.vet.visit.response`,
  storage: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    useConnectionString: process.env.AZURE_STORAGE_USE_CONNECTION_STRING,
    storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME
  }
}

const { error, value } = schema.validate(config, { abortEarly: false })

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

value.notify = notifyConfig

module.exports = { ...value, ...messageQueueConfig }
