const joi = require('joi')
const util = require('util')

const applicationSchema = joi.object({
  confirmCheckDetails: joi.string().required(),
  whichReview: joi.string().required(),
  eligibleSpecies: joi.string().required(),
  reference: joi.string().allow(null).required(),
  declaration: joi.boolean().required(),
  organisation: joi.object({
    farmerName: joi.string().required(),
    name: joi.string().required(),
    sbi: joi.string().required(),
    cph: joi.string().required(),
    address: joi.string().required(),
    email: joi.string().required(),
    isTest: joi.boolean().required()
  })
})

const validateApplication = (event) => {
  const validate = applicationSchema.validate(event)

  if (validate.error) {
    console.log('Application validation error:', util.inspect(validate.error, false, null, true))
    return false
  }

  return true
}

module.exports = validateApplication
