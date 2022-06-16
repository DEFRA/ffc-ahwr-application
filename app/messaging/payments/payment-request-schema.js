const joi = require('joi')

const paymentRequestSchema = joi.object({
  sourceSystem: joi.string().required(),
  sbi: joi.string().required(),
  marketingYear: joi.number().required(),
  paymentRequestNumber: joi.number().required(),
  agreementNumber: joi.string().required(),
  value: joi.number().required(),
  invoiceLines: joi.array().items(joi.object({
    standardCode: joi.string().required(),
    description: joi.string().required(),
    value: joi.number().required()
  })).required()
})

const validatePaymentRequest = (paymentRequest) => {
  const validate = paymentRequestSchema.validate(paymentRequest)

  if (validate.error) {
    console.log('payment request validation error', validate.error)
    return false
  }

  return true
}

module.exports = validatePaymentRequest
