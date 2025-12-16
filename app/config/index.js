import Joi from 'joi'
import { messageQueueConfig } from './message-queue.js'
import { storageConfig } from './storage.js'

const buildConfig = () => {
  const msgTypePrefix = 'uk.gov.ffc.ahwr'
  const DEFAULT_REMINDER_EMAIL_MAX_BATCH_SIZE = 5000

  const schema = Joi.object({
    env: Joi.string()
      .valid('development', 'test', 'production')
      .default('development'),
    isDev: Joi.boolean().default(false),
    serviceUri: Joi.string().uri(),
    documentGeneratorApiUri: Joi.string().uri(),
    sfdMessagingProxyApiUri: Joi.string().uri(),
    messageGeneratorApiUri: Joi.string().uri(),
    applicationRequestMsgType: Joi.string(),
    applicationResponseMsgType: Joi.string(),
    applicationEmailDocRequestMsgType: Joi.string(),
    moveClaimToPaidMsgType: Joi.string(),
    redactPiiRequestMsgType: Joi.string(),
    reminderEmailRequestMsgType: Joi.string(),
    submitPaymentRequestMsgType: Joi.string(),
    complianceCheckRatio: Joi.number().default(1),
    sfdRequestMsgType: Joi.string(),
    messageGeneratorMsgType: Joi.string(),
    messageGeneratorMsgReminderType: Joi.string(),
    multiHerds: {
      releaseDate: Joi.string().required()
    },
    storeHistoryInDb: {
      enabled: Joi.bool().required()
    },
    featureAssurance: {
      enabled: Joi.bool().required(),
      startDate: Joi.string().optional()
    },
    reminderEmailMaxBatchSize: Joi.number(),
    pigsAndPayments: {
      releaseDate: Joi.string().required()
    }
  })

  const mainConfig = {
    env: process.env.NODE_ENV,
    isDev: process.env.NODE_ENV === 'development',
    serviceUri: process.env.SERVICE_URI,
    documentGeneratorApiUri: process.env.DOCUMENT_GENERATOR_SERVICE_URI,
    sfdMessagingProxyApiUri: process.env.SFD_MESSAGING_PROXY_SERVICE_URI,
    messageGeneratorApiUri: process.env.MESSAGE_GENERATOR_SERVICE_URI,
    applicationRequestMsgType: `${msgTypePrefix}.app.request`,
    applicationResponseMsgType: `${msgTypePrefix}.app.response`,
    applicationEmailDocRequestMsgType: `${msgTypePrefix}.app.email.doc.request`,
    moveClaimToPaidMsgType: `${msgTypePrefix}.set.paid.status`,
    redactPiiRequestMsgType: `${msgTypePrefix}.redact.pii.request`,
    reminderEmailRequestMsgType: `${msgTypePrefix}.email.reminder.request`,
    submitPaymentRequestMsgType: `${msgTypePrefix}.submit.payment.request`,
    complianceCheckRatio: process.env.CLAIM_COMPLIANCE_CHECK_RATIO,
    sfdRequestMsgType: `${msgTypePrefix}.sfd.request`,
    messageGeneratorMsgType: `${msgTypePrefix}.claim.status.update`,
    messageGeneratorMsgReminderType: `${msgTypePrefix}.agreement.reminder.email`,
    multiHerds: {
      releaseDate: process.env.MULTI_HERDS_RELEASE_DATE || '2025-05-01'
    },
    storeHistoryInDb: {
      enabled: process.env.STORE_HISTORY_IN_DB_ENABLED === 'true'
    },
    featureAssurance: {
      enabled: process.env.FEATURE_ASSURANCE_ENABLED === 'true',
      startDate: process.env.FEATURE_ASSURANCE_START || undefined
    },
    reminderEmailMaxBatchSize: process.env.REMINDER_EMAIL_MAX_BATCH_SIZE || DEFAULT_REMINDER_EMAIL_MAX_BATCH_SIZE,
    pigsAndPayments: {
      releaseDate: process.env.PIGS_AND_PAYMENTS_RELEASE_DATE || '2026-01-22'
    }
  }

  const { error } = schema.validate(mainConfig, { abortEarly: false })

  if (error) {
    throw new Error(`The server config is invalid. ${error.message}`)
  }

  return mainConfig
}

export const config = {
  ...buildConfig(),
  ...messageQueueConfig,
  storage: storageConfig
}
