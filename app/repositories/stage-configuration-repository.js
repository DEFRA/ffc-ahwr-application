import { buildData } from '../data/index.js'

const { models } = buildData

export const getAll = async () => {
  return await models.stage_configuration.findAll()
}

export const getById = async (id) => {
  return await models.stage_configuration.findOne(
    {
      where: { id }
    })
}
