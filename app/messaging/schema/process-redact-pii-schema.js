import joi from 'joi'
import appInsights from 'applicationinsights'

const redactPIISchema = joi.object({
  requestedDate: joi.string().isoDate().required()
})

export const validateRedactPIISchema = (event, logger) => {
  const { error } = redactPIISchema.validate(event)

  if (error) {
    logger.error(`Redact PII validation error - ${error}.`)
    appInsights.defaultClient.trackException({ exception: error })
    return false
  }

  return true
}
