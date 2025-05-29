import Joi from 'joi'
import { notifyConfig } from './notify.js'
import { messageQueueConfig } from './message-queue.js'
import { storageConfig } from './storage.js'

const buildConfig = () => {
  const msgTypePrefix = 'uk.gov.ffc.ahwr'

  const schema = Joi.object({
    env: Joi.string()
      .valid('development', 'test', 'production')
      .default('development'),
    isDev: Joi.boolean().default(false),
    serviceUri: Joi.string().uri(),
    applicationRequestMsgType: Joi.string(),
    applicationResponseMsgType: Joi.string(),
    applicationEmailDocRequestMsgType: Joi.string(),
    fetchApplicationRequestMsgType: Joi.string(),
    fetchApplicationResponseMsgType: Joi.string(),
    fetchClaimRequestMsgType: Joi.string(),
    fetchClaimResponseMsgType: Joi.string(),
    submitPaymentRequestMsgType: Joi.string(),
    compliance: {
      complianceCheckRatio: Joi.number().default(5),
      endemicsComplianceCheckRatio: Joi.number().default(1)
    },
    sfdRequestMsgType: Joi.string(),
    messageGeneratorMsgType: Joi.string(),
    multiHerds: {
      enabled: Joi.bool().required(),
      releaseDate: Joi.string().required()
    },
    storeHistoryInDb: {
      enabled: Joi.bool().required()
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
    submitPaymentRequestMsgType: `${msgTypePrefix}.submit.payment.request`,
    compliance: {
      complianceCheckRatio: process.env.CLAIM_COMPLIANCE_CHECK_RATIO,
      endemicsComplianceCheckRatio:
        process.env.ENDEMICS_CLAIM_COMPLIANCE_CHECK_RATIO
    },
    sfdRequestMsgType: `${msgTypePrefix}.sfd.request`,
    messageGeneratorMsgType: `${msgTypePrefix}.claim.status.update`,
    multiHerds: {
      enabled: process.env.MULTI_HERDS_ENABLED === 'true',
      releaseDate: process.env.MULTI_HERDS_RELEASE_DATE || '2025-05-01'
    },
    storeHistoryInDb: {
      enabled: process.env.STORE_HISTORY_IN_DB_ENABLED === 'true'
    }
  }

  const { error } = schema.validate(config, { abortEarly: false })

  if (error) {
    throw new Error(`The server config is invalid. ${error.message}`)
  }

  return config
}

export const config = {
  ...buildConfig(),
  ...messageQueueConfig,
  notify: notifyConfig,
  storage: storageConfig
}
