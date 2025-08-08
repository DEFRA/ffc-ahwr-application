import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import { buildData } from '../data/index.js'
import { Op } from 'sequelize'

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

export const deleteFlag = async (flagId, user, deletedNote) => {
  return models.flag.update(
    { deletedAt: new Date(), deletedBy: user, deletedNote },
    { where: { id: flagId }, returning: true }
  )
}

export const getAllFlags = async () => {
  return models.flag.findAll({ where: { deletedAt: null, deletedBy: null } })
}

export const getFlagsForApplicationIncludingDeleted = async (applicationReference) => {
  return models.flag.findAll({ where: { applicationReference } })
}

export const redactPII = async (applicationReference) => {
  await buildData.models.flag.update(
    {
      note: `${REDACT_PII_VALUES.REDACTED_NOTE}`
    },
    {
      where: {
        applicationReference,
        note: { [Op.not]: null }
      }
    }
  )
}

export const createFlagForRedactPII = async (data) => {
  const existingAppliesToMhFlag = await getFlagByAppRef(data.applicationReference, false)
  if (existingAppliesToMhFlag) {
    await deleteFlag(existingAppliesToMhFlag.id, 'admin', 'Deleted to allow \'Redact PII\' flag to be added, only one flag with appliesToMh=false allowed.')
  }

  return await createFlag(data)
}
