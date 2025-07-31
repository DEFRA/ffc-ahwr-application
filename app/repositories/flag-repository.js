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
  // TODO 1067 no updatedBy/At, update deletedBy/At instead?
  // eslint-disable-next-line no-unused-vars
  // const [_, updates] = await models.claim_update_history.update(
  await buildData.models.flag.update(
    {
      note: `${REDACT_PII_VALUES.REDACTED_NOTE}`
    },
    {
      where: {
        applicationReference,
        note: { [Op.not]: null }
      },
      returning: true
    }
  )

  // TODO 1067 send event? add history row?
  // const [updatedRecord] = updates
  // const { updatedAt, data: { organisation: { sbi } } } = updatedRecord.dataValues

  // const eventData = {
  //   applicationReference: reference,
  //   reference,
  //   updatedProperty,
  //   newValue,
  //   oldValue,
  //   note
  // }
  // const type = `application-${updatedProperty}`
  // await claimDataUpdateEvent(eventData, type, user, updatedAt, sbi)

  // await buildData.models.claim_update_history.create({
  //   applicationReference: reference,
  //   reference,
  //   note,
  //   updatedProperty,
  //   newValue,
  //   oldValue,
  //   eventType: type,
  //   createdBy: user
  // })
}
