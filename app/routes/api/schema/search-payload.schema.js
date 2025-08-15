import Joi from 'joi'

const SEARCH_MAX_LIMIT = 20

export const searchPayloadSchema = {
  offset: Joi.number().default(0),
  limit: Joi.number().greater(0).default(SEARCH_MAX_LIMIT),
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
