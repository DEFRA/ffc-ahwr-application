const joi = require('joi')
const util = require('util')

const fetchApplicationSchema = joi.object({
  applicationReference: joi.string().required()
})

const validateFetchApplication = (event) => {
  const validate = fetchApplicationSchema.validate(event)

  if (validate.error) {
    console.log('Fetch Application validation error:', util.inspect(validate.error, false, null, true))
    return false
  }

  return true
}

module.exports = validateFetchApplication
