const joi = require('joi')
const util = require('util')

const submitClaimSchema = joi.object({
  reference: joi.string().required()
})

const validateSubmitClaim = (event) => {
  const validate = submitClaimSchema.validate(event)

  if (validate.error) {
    console.log('Submit claim validation error:', util.inspect(validate.error, false, null, true))
    return false
  }

  return true
}

module.exports = validateSubmitClaim
