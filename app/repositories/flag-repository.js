import { buildData } from '../data/index.js'

const { models } = buildData

export const createFlag = async (data) => {
  return await models.flag.create(data)
}

export const getFlagByAppRef = async (appRef) => {
  return await models.flag.findOne({
    where: { applicationReference: appRef, deletedAt: null, deletedBy: null }
  })
}

export const getFlagByFlagId = async (flagId) => {
  return await models.flag.findOne({ where: { id: flagId } })
}

export const getFlagsForApplication = async (applicationReference) => {
  const result = await models.flag.findAll({
    where: { applicationReference, deletedAt: null, deletedBy: null }
  })

  return result.map(entry => entry.dataValues)
}

export const deleteFlag = async (flagId, user) => {
  return await models.flag.update(
    { deletedAt: new Date(), deletedBy: user },
    { where: { id: flagId } }
  )
}
