import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import { buildData } from '../data/index.js'

const { models } = buildData

export const createHerd = async (data) => {
  return models.herd.create(data)
}

export const getHerdById = async (id) => {
  return models.herd.findOne({
    where: { id } // should this use isCurrent: true
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
      }
    }
  )
}
