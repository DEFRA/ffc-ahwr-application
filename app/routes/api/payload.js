// Todo: verify where this file should be kept in the project

const Joi = require('joi')

const userSearchPayload = Joi.object({
  farmerName: Joi.string().optional(),
  name: Joi.string().optional(),
  sbi: Joi.string().optional(),
  cph: Joi.string().optional(),
  text: Joi.string().optional()
})

module.exports = {
  userSearchPayload
}
