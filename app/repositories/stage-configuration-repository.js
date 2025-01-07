import { buildData } from '../data/index.js'

const { models } = buildData

export const getAll = async () => {
  return models.stage_configuration.findAll()
}

export const getById = async (id) => {
  return models.stage_configuration.findOne(
    {
      where: { id }
    })
}
