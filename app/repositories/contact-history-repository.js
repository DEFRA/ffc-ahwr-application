import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import { buildData } from '../data/index.js'
import { Sequelize } from 'sequelize'

const { models } = buildData

export const getAllByApplicationReference = async (applicationReference) => {
  const result = await models.contact_history.findAll({
    where: {
      applicationReference: applicationReference.toUpperCase()
    },
    order: [['createdAt', 'DESC']]
  })
  return result
}

export const set = async (data) => {
  const result = await models.contact_history.create(data)
  return result
}

export const redactPII = async (applicationReference, logger) => {
  const data = Sequelize.fn(
    'jsonb_set',
    Sequelize.fn(
      'jsonb_set',
      Sequelize.col('data'),
      Sequelize.literal('\'{newValue}\''),
      Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_MULTI_TYPE_VALUE}"'`)),
    Sequelize.literal('\'{oldValue}\''),
    Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_MULTI_TYPE_VALUE}"'`)
  )
  const [, updatedRows] = await buildData.models.contact_history.update(
    {
      data,
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

  updatedRows.forEach(row => {
    const appRef = row.dataValues.applicationReference
    const fieldValue = row.dataValues.data?.field

    logger.info(`Redacted ${fieldValue} in ${appRef}`)
  })
}
