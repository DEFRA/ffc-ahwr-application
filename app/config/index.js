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
    optionalPIHunt: {
      enabled: Joi.bool()
    },
    sfdRequestMsgType: Joi.string(),
    sfdMessage: {
      enabled: Joi.bool()
    },
    messageGeneratorMsgType: Joi.string()
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
    optionalPIHunt: {
      enabled: process.env.OPTIONAL_PIHUNT_ENABLED === 'true'
    },
    sfdRequestMsgType: `${msgTypePrefix}.sfd.request`,
    sfdMessage: {
      enabled: process.env.SFD_MESSAGE_ENABLED === 'true'
    },
    messageGeneratorMsgType: `${msgTypePrefix}.claim.status.update`
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
