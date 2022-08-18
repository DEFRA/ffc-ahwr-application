const Joi = require('joi')
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
  applicationResponseQueue: {
    address: Joi.string().default('applicationResponseQueue'),
    type: Joi.string(),
    ...sharedConfigSchema
  },
  applicationEventMsgType: `${msgTypePrefix}.app.event`,
  applicationEventQueue: {
    address: process.env.APPLICATIONEVENT_QUEUE_ADDRESS,
    type: 'queue',
    ...sharedConfig
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
  applicationRequestQueue: {
    address: process.env.APPLICATIONREQUEST_QUEUE_ADDRESS,
    type: 'queue',
    ...sharedConfig
  },
  applicationResponseQueue: {
    address: process.env.APPLICATIONRESPONSE_QUEUE_ADDRESS,
    type: 'queue',
    ...sharedConfig
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
  }
}

const { error, value } = schema.validate(config, { abortEarly: false })

if (error) {
  throw new Error(`The message queue config is invalid. ${error.message}`)
}

module.exports = value
