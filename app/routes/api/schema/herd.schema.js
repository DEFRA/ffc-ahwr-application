import Joi from 'joi'

export const newHerd = Joi.object({
  herdId: Joi.string().required(),
  herdVersion: Joi.number().required(),
  herdName: Joi.string().required(),
  cph: Joi.string().required(),
  herdReasons: Joi.array().required(),
  herdSame: Joi.string().valid('yes', 'no')
})

export const updateHerd = Joi.object({
  herdId: Joi.string().required(),
  herdVersion: Joi.number().required(),
  cph: Joi.string().required(),
  herdReasons: Joi.array().required()
})

export const herdSchema = { herd: Joi.alternatives().try(updateHerd, newHerd).required() }
