import Joi from 'joi'
import applicationInsights from 'applicationinsights'

export const getMessageQueueConfig = () => {
  const sharedConfigSchema = {
    appInsights: Joi.object(),
    host: Joi.string().default('localhost'),
    password: Joi.string(),
    username: Joi.string(),
    useCredentialChain: Joi.bool().default(false),
    managedIdentityClientId: Joi.string().optional(),
    retries: 50,
    retryWaitInMs: 100,
    connectionString: Joi.string().optional()
  }

  const schema = Joi.object({
    applicationDocCreationRequestQueue: {
      address: Joi.string(),
      type: Joi.string(),
      ...sharedConfigSchema
    },
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
    submitRequestQueue: {
      address: Joi.string().default('submitRequestQueue'),
      type: Joi.string(),
      ...sharedConfigSchema
    },
    eventQueue: {
      address: Joi.string(),
      type: Joi.string(),
      ...sharedConfigSchema
    },
    sfdMessageQueue: {
      address: Joi.string(),
      type: Joi.string(),
      ...sharedConfigSchema
    },
    messageGeneratorQueue: {
      address: Joi.string(),
      type: Joi.string(),
      ...sharedConfigSchema
    }
  })

  const sharedConfig = {
    appInsights: applicationInsights,
    host: process.env.MESSAGE_QUEUE_HOST,
    password: process.env.MESSAGE_QUEUE_PASSWORD,
    username: process.env.MESSAGE_QUEUE_USER,
    useCredentialChain: process.env.NODE_ENV === 'production',
    managedIdentityClientId: process.env.AZURE_CLIENT_ID,
    connectionString: process.env.QUEUE_CONNECTION_STRING
  }

  const config = {
    applicationDocCreationRequestQueue: {
      address: process.env.APPLICATIONDOCCREATIONREQUEST_QUEUE_ADDRESS,
      type: 'queue',
      ...sharedConfig
    },
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
    submitRequestQueue: {
      address: process.env.PAYMENTREQUEST_QUEUE_ADDRESS,
      type: 'queue',
      ...sharedConfig
    },
    eventQueue: {
      address: process.env.EVENT_QUEUE_ADDRESS,
      type: 'queue',
      ...sharedConfig
    },
    sfdMessageQueue: {
      address: process.env.SFD_MESSAGE_QUEUE_ADDRESS,
      type: 'queue',
      ...sharedConfig
    },
    messageGeneratorQueue: {
      address: process.env.MESSAGE_GENERATOR_QUEUE_ADDRESS,
      type: 'queue',
      ...sharedConfig
    }
  }

  const { error } = schema.validate(config, { abortEarly: false })

  if (error) {
    throw new Error(`The message queue config is invalid. ${error.message}`)
  }

  return config
}

export const messageQueueConfig = getMessageQueueConfig()
