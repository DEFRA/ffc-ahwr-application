import joi from 'joi'

const MIN_SBI_NUMBER = 105000000
const MAX_SBI_NUMBER = 210000000
const SBI_SHOULD_BE_LESS_THAN = 1000000000
const SBI_SHOULD_BE_GREATER_THAN = 99999999.9

export const sbiSchema = joi.number()
  .optional()
  .integer()
  .min(MIN_SBI_NUMBER)
  .max(MAX_SBI_NUMBER)
  .less(SBI_SHOULD_BE_LESS_THAN)
  .greater(SBI_SHOULD_BE_GREATER_THAN)
