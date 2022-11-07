const joi = require('joi')
const util = require('util')

const submitClaimSchema = joi.object({
  reference: joi.string().required(),
  data: joi.object({
    confirmCheckDetails: joi.string().required(),
    whichReview: joi.string().required(),
    eligibleSpecies: joi.string().required(),
    reference: joi.string().allow(null).required(),
    declaration: joi.boolean().required(),
    offerStatus: joi.string().required(),
    visitDate: joi.string().required(),
    vetName: joi.string().required(),
    urnResult: joi.string().required(),
    vetRcvs: joi.string().required(),
    detailsCorrect: joi.string().required(),
    organisation: joi.object({
      farmerName: joi.string().required(),
      name: joi.string().required(),
      sbi: joi.string().required(),
      cph: joi.string().required(),
      address: joi.string().required(),
      email: joi.string().required(),
      isTest: joi.boolean().optional()
    })
  })
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
