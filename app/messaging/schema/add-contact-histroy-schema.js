const joi = require('joi')
const util = require('util')
const SBI_SCHEMA = require('./schema/sbi.schema.js')

const addContactHistory = joi.object({
  applicationReferenceNumber: joi.string().required(),
  claimReferenceNumber: joi.string().allow(null).optional(),
  data: joi.object({
    field: joi.string(),
    oldValue: joi.string(),
    newValue: joi.string()
  }),
  sbi: SBI_SCHEMA

})

const validateAddContactHistory = (event) => {
  const validate = addContactHistory.validate(event)

  if (validate.error) {
    console.log('Add contact history validation error:', util.inspect(validate.error, false, null, true))
    return false
  }
  return true
}

module.exports = validateAddContactHistory
