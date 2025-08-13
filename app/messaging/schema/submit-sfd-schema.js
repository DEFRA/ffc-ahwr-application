import joi from 'joi'
import util from 'util'

const MAX_EMAIL_LENGTH = 320
const MAX_CLAIM_REF_LENGTH = 14
const nineDigitId = joi.string().pattern(/^\d{9}$/)
const tenDigitId = joi.string().pattern(/^\d{10}$/)
const email = joi
  .string()
  .pattern(/^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  .min(1)
  .max(MAX_EMAIL_LENGTH)

const submitSFDSchema = joi.object({
  crn: tenDigitId,
  sbi: nineDigitId.required(),
  agreementReference: joi.string().required(),
  claimReference: joi.string().max(MAX_CLAIM_REF_LENGTH),
  notifyTemplateId: joi.string().guid({ version: 'uuidv4' }).required(),
  emailAddress: email.required(),
  customParams: joi.object().required(),
  dateTime: joi.date().required()
})

export const validateSFDSchema = (event) => {
  const validate = submitSFDSchema.validate(event)

  if (validate.error) {
    console.log('Submit SFD message validation error:', util.inspect(validate.error, false, null, true))
    return false
  }
  return true
}
