import joi from 'joi'
import util from 'util'

const setPaymentStatusToPaidSchema = joi.object({
  claimRef: joi.string().required(),
  sbi: joi.string().required()
})

export const validateClaimStatusToPaidEvent = (event, logger) => {
  const validate = setPaymentStatusToPaidSchema.validate(event)

  if (validate.error) {
    logger.info(`Claim status to paid validation error: ${util.inspect(validate.error, false, null, true)}`)
    return false
  }

  return true
}
