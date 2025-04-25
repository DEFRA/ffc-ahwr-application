import { buildData } from '../data/index.js'

const { models } = buildData

export const createFlag = async (data) => {
  return models.flag.create(data)
}

export const getFlagByAppRef = async (applicationReference, appliesToMh) => {
  return models.flag.findOne({
    where: { applicationReference, deletedAt: null, deletedBy: null, appliesToMh }
  })
}

export const getFlagsForApplication = async (applicationReference) => {
  const result = await models.flag.findAll({
    where: { applicationReference, deletedAt: null, deletedBy: null }
  })

  return result.map(entry => entry.dataValues)
}

export const deleteFlag = async (flagId, user) => {
  return models.flag.update(
    { deletedAt: new Date(), deletedBy: user },
    { where: { id: flagId }, returning: true }
  )
}

export const getAllFlags = async () => {
  return models.flag.findAll({ where: { deletedAt: null, deletedBy: null } })
}
