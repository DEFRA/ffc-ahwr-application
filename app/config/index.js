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
  notify: {
    apiKey: Joi.string().pattern(notifyApiKeyRegex),
    templateIdFarmerApplicationComplete: Joi.string().uuid(),
    templateIdFarmerApplicationClaim: Joi.string().uuid(),
    templateIdFarmerClaimComplete: Joi.string().uuid(),
    templateIdFarmerVetRecordIneligible: Joi.string().uuid(),
    templateIdVetApplicationComplete: Joi.string().uuid()
  },
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
  submitClaimRequestMsgType: Joi.string(),
  submitClaimResponseMsgType: Joi.string(),
  vetVisitRequestMsgType: Joi.string(),
  vetVisitResponseMsgType: Joi.string(),
  submitPaymentRequestMsgType: Joi.string()
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
  notify: {
    apiKey: process.env.NOTIFY_API_KEY,
    templateIdFarmerApplicationComplete: process.env.NOTIFY_TEMPLATE_ID_FARMER_APPLICATION_COMPLETE,
    templateIdFarmerApplicationClaim: process.env.NOTIFY_TEMPLATE_ID_FARMER_APPLICATION_CLAIM,
    templateIdFarmerClaimComplete: process.env.NOTIFY_TEMPLATE_ID_FARMER_CLAIM_COMPLETE,
    templateIdFarmerVetRecordIneligible: process.env.NOTIFY_TEMPLATE_ID_FARMER_VET_RECORD_INELIGIBLE,
    templateIdVetApplicationComplete: process.env.NOTIFY_TEMPLATE_ID_VET_APPLICATION_COMPLETE
  },
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
  submitClaimRequestMsgType: `${msgTypePrefix}.submit.claim.request`,
  submitClaimResponseMsgType: `${msgTypePrefix}.submit.claim.response`,
  vetVisitRequestMsgType: `${msgTypePrefix}.vet.visit.request`,
  vetVisitResponseMsgType: `${msgTypePrefix}.vet.visit.response`,
  submitPaymentRequestMsgType: `${msgTypePrefix}.submit.payment.request`
}

const { error, value } = schema.validate(config, { abortEarly: false })

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

module.exports = value
