const Joi = require('joi')

const schema = Joi.object({
  apiKey: Joi.string().pattern(notifyApiKeyRegex),
  templateIdFarmerApplicationComplete: Joi.string().uuid(),
  templateIdFarmerApplicationClaim: Joi.string().uuid(),
  templateIdFarmerClaimComplete: Joi.string().uuid(),
  templateIdFarmerVetRecordIneligible: Joi.string().uuid(),
  templateIdVetApplicationComplete: Joi.string().uuid()
})

const config = {
  apiKey: process.env.NOTIFY_API_KEY,
  templateIdFarmerApplicationComplete: process.env.NOTIFY_TEMPLATE_ID_FARMER_APPLICATION_COMPLETE,
  templateIdFarmerApplicationClaim: process.env.NOTIFY_TEMPLATE_ID_FARMER_APPLICATION_CLAIM,
  templateIdFarmerClaimComplete: process.env.NOTIFY_TEMPLATE_ID_FARMER_CLAIM_COMPLETE,
  templateIdFarmerVetRecordIneligible: process.env.NOTIFY_TEMPLATE_ID_FARMER_VET_RECORD_INELIGIBLE,
  templateIdVetApplicationComplete: process.env.NOTIFY_TEMPLATE_ID_VET_APPLICATION_COMPLETE
}

const { error, value } = schema.validate(config, { abortEarly: false })

if (error) {
  throw new Error(`Notify config is invalid. ${error.message}`)
}

module.exports = value
