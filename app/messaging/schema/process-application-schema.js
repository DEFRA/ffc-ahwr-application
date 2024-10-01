const joi = require('joi')
const appInsights = require('applicationinsights')
const endemicsEnabled = require('../../config/index').endemics.enabled

const commonValidations = () => ({
  reference: joi.string().allow(null).required(),
  declaration: joi.boolean().required(),
  offerStatus: joi.string().required()
})

const organisationValidations = () => ({
  farmerName: joi.string().required(),
  name: joi.string().required(),
  sbi: joi.string().required(),
  cph: joi.string().optional(),
  crn: joi.string().optional(),
  frn: joi.string().optional(),
  address: joi.string().required(),
  email: joi.string().required().lowercase().email({ tlds: false }),
  orgEmail: joi
    .string()
    .allow(null)
    .optional()
    .lowercase()
    .email({ tlds: false }),
  isTest: joi.boolean().optional()
})

const applicationSchema = joi.object({
  confirmCheckDetails: joi.string().required(),
  whichReview: joi.string().required(),
  eligibleSpecies: joi.string().required(),
  ...commonValidations(),
  organisation: joi.object({
    ...organisationValidations()
  }),
  contactHistory: joi.array().items(
    joi
      .object({
        createdBy: joi.string(),
        createdOn: joi.string(),
        field: joi.string(),
        oldValue: joi.string(),
        newValue: joi.string()
      })
      .allow(null)
      .optional()
  )
})

const endemicsApplicationSchema = joi.object({
  confirmCheckDetails: joi.string().required(),
  whichReview: joi.string().optional(),
  eligibleSpecies: joi.string().optional(),
  ...commonValidations(),
  organisation: joi.object({
    ...organisationValidations(),
    userType: joi.string().valid('newUser', 'existingUser').required()
  }),
  type: joi.string().valid('VV', 'EE').required(),
  contactHistory: joi.array().items(
    joi
      .object({
        createdBy: joi.string(),
        createdOn: joi.string(),
        field: joi.string(),
        oldValue: joi.string(),
        newValue: joi.string()
      })
      .allow(null)
      .optional()
  ),
  oldWorldRejectedAgreement10months: joi
    .object({
      isExistingUserRejectedAgreementWithin10months: joi.boolean(),
      message: joi.string()
    })
    .optional()
})

const validateApplication = (event) => {
  const validate = endemicsEnabled
    ? endemicsApplicationSchema.validate(event)
    : applicationSchema.validate(event)

  if (validate.error) {
    console.error(`Application validation error - ${validate.error}.`)
    appInsights.defaultClient.trackException({ exception: validate.error })
    return false
  }

  return true
}

module.exports = validateApplication
