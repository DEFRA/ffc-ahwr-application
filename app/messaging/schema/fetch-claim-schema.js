import joi from 'joi'
import util from 'util'

const fetchClaimSchema = joi.object({
  email: joi.string().required()
})

export const validateFetchClaim = (event) => {
  const validate = fetchClaimSchema.validate(event)

  if (validate.error) {
    console.log('Fetch Claim validation error:', util.inspect(validate.error, false, null, true))
    return false
  }

  return true
}
