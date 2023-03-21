const Joi = require('joi')

module.exports = Joi
  .string()
  .trim()
  .lowercase()
  .email()
  .optional()
