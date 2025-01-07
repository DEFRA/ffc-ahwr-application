import joi from 'joi'
import appInsights from 'applicationinsights'

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
  orgEmail: joi.string().allow(null).optional().lowercase().email({ tlds: false }),
  isTest: joi.boolean().optional()
})

const aplicationSchema = joi.object({
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
    joi.object({
      createdBy: joi.string(),
      createdOn: joi.string(),
      field: joi.string(),
      oldValue: joi.string(),
      newValue: joi.string()
    }).allow(null).optional()
  )
})

export const validateApplication = (event) => {
  const validate = aplicationSchema.validate(event)

  if (validate.error) {
    console.error(`Application validation error - ${validate.error}.`)
    appInsights.defaultClient.trackException({ exception: validate.error })
    return false
  }

  return true
}
