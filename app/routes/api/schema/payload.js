const Joi = require('joi')

const userSearchPayload = Joi.object({
  farmerName: Joi.string().optional(),
  name: Joi.string().optional(),
  sbi: Joi.number().optional(),
  cph: Joi.string().pattern(/^\d{2}\/\d{3}\/\d{4}$/).optional(),
  text: Joi.alternatives().try(Joi.string(), Joi.number()).optional()
})

module.exports = {
  userSearchPayload
}
