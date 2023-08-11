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
  applicationEmailDocRequestMsgType: Joi.string(),
  fetchApplicationRequestMsgType: Joi.string(),
  fetchApplicationResponseMsgType: Joi.string(),
  fetchClaimRequestMsgType: Joi.string(),
  fetchClaimResponseMsgType: Joi.string(),
  submitClaimRequestMsgType: Joi.string(),
  submitClaimResponseMsgType: Joi.string(),
  submitPaymentRequestMsgType: Joi.string(),
  storage: {
    connectionString: Joi.string().required(),
    usersContainer: Joi.string().default('users'),
    usersFile: Joi.string().default('users.json'),
    storageAccount: Joi.string().required(),
    useConnectionString: Joi.bool().default(true)
  },
  compliance: {
    complianceCheckRatio: Joi.number().default(5)
  }
})

const config = {
  env: process.env.NODE_ENV,
  isDev: process.env.NODE_ENV === 'development',
  serviceUri: process.env.SERVICE_URI,
  applicationRequestMsgType: `${msgTypePrefix}.app.request`,
  applicationResponseMsgType: `${msgTypePrefix}.app.response`,
  applicationEmailDocRequestMsgType: `${msgTypePrefix}.app.email.doc.request`,
  fetchApplicationRequestMsgType: `${msgTypePrefix}.fetch.app.request`,
  fetchApplicationResponseMsgType: `${msgTypePrefix}.fetch.app.response`,
  fetchClaimRequestMsgType: `${msgTypePrefix}.fetch.claim.request`,
  fetchClaimResponseMsgType: `${msgTypePrefix}.fetch.claim.response`,
  submitClaimRequestMsgType: `${msgTypePrefix}.submit.claim.request`,
  submitClaimResponseMsgType: `${msgTypePrefix}.submit.claim.response`,
  submitPaymentRequestMsgType: `${msgTypePrefix}.submit.payment.request`,
  storage: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    useConnectionString: process.env.AZURE_STORAGE_USE_CONNECTION_STRING,
    storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME
  },
  compliance: {
    complianceCheckRatio: process.env.COMPLIANCE_APPLICATION_COUNT
  }
}

const { error, value } = schema.validate(config, { abortEarly: false })

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

value.notify = notifyConfig

module.exports = { ...value, ...messageQueueConfig }
