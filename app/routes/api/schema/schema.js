const Joi = require('joi')

const userSearchResponseSchema = Joi.array().items(Joi.object({
  farmerName: Joi.string().required(),
  name: Joi.string().required(),
  sbi: Joi.number().required(),
  cph: Joi.string().required(),
  address: Joi.string().required(),
  email: Joi.string().email().required(),
  isTest: Joi.boolean().optional()
}))

module.exports = {
  userSearchResponseSchema
}
