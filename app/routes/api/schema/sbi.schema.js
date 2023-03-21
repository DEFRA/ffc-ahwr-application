const Joi = require('joi')

const MIN_SBI_NUMBER = 105000000
const MAX_SBI_NUMBER = 210000000

module.exports = Joi
  .number()
  .optional()
  .integer()
  .min(MIN_SBI_NUMBER)
  .max(MAX_SBI_NUMBER)
  .less(1000000000)
  .greater(99999999.9)
