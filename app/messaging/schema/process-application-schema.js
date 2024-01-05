const joi = require('joi')
const endemicsEnabled = require('../../config/index').endemics.enabled

const applicationSchema = joi.object({
  confirmCheckDetails: joi.string().required(),
  whichReview: joi.string().required(),
  eligibleSpecies: joi.string().required(),
  reference: joi.string().allow(null).required(),
  declaration: joi.boolean().required(),
  offerStatus: joi.string().required(),
  organisation: joi.object({
    farmerName: joi.string().required(),
    name: joi.string().required(),
    sbi: joi.string().required(),
    cph: joi.string().optional(),
    crn: joi.string().optional(),
    address: joi.string().required(),
    email: joi.string().required().lowercase().email({ tlds: false }),
    isTest: joi.boolean().optional()
  })
})

const endemicsApplicationSchema = joi.object({
  confirmCheckDetails: joi.string().required(),
  whichReview: joi.string().optional(),
  eligibleSpecies: joi.string().optional(),
  reference: joi.string().allow(null).required(),
  declaration: joi.boolean().required(),
  offerStatus: joi.string().required(),
  organisation: joi.object({
    farmerName: joi.string().required(),
    name: joi.string().required(),
    sbi: joi.string().required(),
    cph: joi.string().optional(),
    crn: joi.string().optional(),
    address: joi.string().required(),
    email: joi.string().required().lowercase().email({ tlds: false }),
    isTest: joi.boolean().optional()
  }),
  type: joi.string().valid('VV', 'EE').required()
})

const validateApplication = (event) => {
  const validate = endemicsEnabled ? endemicsApplicationSchema.validate(event) : applicationSchema.validate(event)

  if (validate.error) {
    console.error(`Application validation error - ${validate.error}.`)
    return false
  }

  return true
}

module.exports = validateApplication
