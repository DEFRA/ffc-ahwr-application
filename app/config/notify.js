const Joi = require('joi')
const uuidRegex = '[0-9a-f]{8}\\b-[0-9a-f]{4}\\b-[0-9a-f]{4}\\b-[0-9a-f]{4}\\b-[0-9a-f]{12}'
const notifyApiKeyRegex = new RegExp(`.*-${uuidRegex}-${uuidRegex}`)

const schema = Joi.object({
  apiKey: Joi.string().pattern(notifyApiKeyRegex),
  carbonCopyEmailAddress: Joi.string().email().allow(null, ''),
  templateIdFarmerApplicationComplete: Joi.string().uuid(),
  templateIdFarmerClaimComplete: Joi.string().uuid(),
  templateIdFarmerEndemicsClaimComplete: Joi.string().uuid(),
  templateIdFarmerEndemicsReviewComplete: Joi.string().uuid(),
  templateIdFarmerEndemicsFollowupComplete: Joi.string().uuid()
})

const config = {
  apiKey: process.env.NOTIFY_API_KEY,
  carbonCopyEmailAddress: process.env.CARBON_COPY_EMAIL_ADDRESS,
  templateIdFarmerApplicationComplete: process.env.NOTIFY_TEMPLATE_ID_FARMER_APPLICATION_COMPLETE,
  templateIdFarmerClaimComplete: process.env.NOTIFY_TEMPLATE_ID_FARMER_CLAIM_COMPLETE,
  templateIdFarmerEndemicsReviewComplete: process.env.NOTIFY_TEMPLATE_ID_FARMER_ENDEMICS_REVIEW_COMPLETE,
  templateIdFarmerEndemicsFollowupComplete: process.env.NOTIFY_TEMPLATE_ID_FARMER_ENDEMICS_FOLLOWUP_COMPLETE
}

const { error, value } = schema.validate(config, { abortEarly: false })

if (error) {
  throw new Error(`Notify config is invalid. ${error.message}`)
}

module.exports = value
