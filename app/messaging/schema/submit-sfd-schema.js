const joi = require('joi')
const util = require('util')

const nineDigitId = joi.string().pattern(/^\d{9}$/)
const tenDigitId = joi.string().pattern(/^\d{10}$/)
const email = joi
  .string()
  .pattern(/^[\w-\\.]+@([\w-]+\.)+[\w-]{2,4}$/)
  .min(1)
  .max(320)

const submitSFDSchema = joi.object({
  crn: tenDigitId,
  sbi: nineDigitId.required(),
  agreementReference: joi.string().required(),
  claimReference: joi.string().max(14),
  notifyTemplateId: joi.string().guid({ version: 'uuidv4' }).required(),
  emailAddress: email.required(),
  customParams: joi.object().required(),
  dateTime: joi.date().required()
})

const validateSFDClaim = (event) => {
  const validate = submitSFDSchema.validate(event)

  if (validate.error) {
    console.log('Submit claim validation error:', util.inspect(validate.error, false, null, true))
    return false
  }
  return true
}

module.exports = validateSFDClaim
