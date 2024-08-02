const Joi = require('joi')

const searchPayloadValidations = () => ({
  offset: Joi.number().default(0),
  limit: Joi.number().greater(0).default(20),
  search: Joi.object({
    text: Joi.string().valid().optional().allow(''),
    type: Joi.string().valid().optional().default('sbi')
  }).optional()
})

module.exports = {
  searchPayloadValidations
}
