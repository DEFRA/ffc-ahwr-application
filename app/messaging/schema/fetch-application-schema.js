import joi from 'joi'
import util from 'util'

const fetchApplicationSchema = joi.object({
  applicationReference: joi.string().required()
})

export const validateFetchApplication = (event) => {
  const validate = fetchApplicationSchema.validate(event)

  if (validate.error) {
    console.log('Fetch Application validation error:', util.inspect(validate.error, false, null, true))
    return false
  }

  return true
}
