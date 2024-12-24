import { buildData } from '../data'

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
