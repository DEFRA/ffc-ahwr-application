import Joi from 'joi'

export const searchPayloadSchema = {
  offset: Joi.number().default(0),
  limit: Joi.number().greater(0).default(20),
  search: Joi.object({
    text: Joi.string().valid().optional().allow(''),
    type: Joi.string().valid().optional().allow('')
  }).optional(),
  filter: Joi.object({
    field: Joi.string().required(),
    op: Joi.string().required(),
    value: Joi.string().required()
  }).optional()
}
