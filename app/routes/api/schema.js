// Todo: verify where this file should be kept in the project

const Joi = require('joi')

const userSearchResponseSchema = Joi.array().items(Joi.object({
  farmerName: Joi.string().required(),
  name: Joi.string().required(),
  sbi: Joi.string().required(),
  cph: Joi.string().required(),
  address: Joi.string().required(),
  email: Joi.string().required(),
  isTest: Joi.boolean().optional()
}))

module.exports = {
  userSearchResponseSchema
}
