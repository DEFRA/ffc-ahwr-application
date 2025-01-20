import joi from 'joi'

export const getNotifyConfig = () => {
  const schema = joi.object({
    carbonCopyEmailAddress: joi.string().email().allow(null, ''),
    templateIdFarmerEndemicsReviewComplete: joi.string().uuid().required(),
    templateIdFarmerEndemicsFollowupComplete: joi.string().uuid().required()
  })

  const config = {
    carbonCopyEmailAddress: process.env.CARBON_COPY_EMAIL_ADDRESS,
    templateIdFarmerEndemicsReviewComplete: process.env.NOTIFY_TEMPLATE_ID_FARMER_ENDEMICS_REVIEW_COMPLETE ?? 'd8017132-1909-4bee-b604-b07e8081dc82',
    templateIdFarmerEndemicsFollowupComplete: process.env.NOTIFY_TEMPLATE_ID_FARMER_ENDEMICS_FOLLOWUP_COMPLETE ?? 'bf194e44-0dab-4c0e-ba9d-55bce357d3fc'
  }

  const { error } = schema.validate(config, { abortEarly: false })

  if (error) {
    throw new Error(`Notify config is invalid. ${error.message}`)
  }

  return config
}

export const notifyConfig = getNotifyConfig()
