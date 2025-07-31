import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import { buildData } from '../data/index.js'

const { models } = buildData

export const createHerd = async (data) => {
  return models.herd.create(data)
}

export const getHerdById = async (id) => {
  return models.herd.findOne({
    where: { id }
  })
}

export const updateIsCurrentHerd = async (id, isCurrent, version) => {
  return models.herd.update(
    { isCurrent },
    { where: { id, version } }
  )
}

export const getHerdsByAppRefAndSpecies = async (applicationReference, species) => {
  return models.herd.findAll({
    where: { applicationReference, ...(species ? { species } : {}), isCurrent: true }
  })
}

export const redactPII = async (applicationReference) => {
  // eslint-disable-next-line no-unused-vars
  // const [_, updates] = await models.claim_update_history.update(
  await buildData.models.herd.update(
    {
      herdName: `${REDACT_PII_VALUES.REDACTED_HERD_NAME}`,
      cph: `${REDACT_PII_VALUES.REDACTED_CPH}`,
      updatedBy: 'admin',
      updatedAt: Date.now()
    },
    {
      where: {
        applicationReference
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
