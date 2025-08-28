import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import { buildData } from '../data/index.js'
import { Op, Sequelize } from 'sequelize'

const { models } = buildData

export const getFailedApplicationRedact = async (requestedDate) => {
  return models.application_redact.findAll({
    where: {
      requestedDate,
      success: 'N'
    }
  })
}

export const createApplicationRedact = async (data) => {
  return models.application_redact.create(data)
}

export const updateApplicationRedact = async (id, retryCount, status, success, options = {}) => {
  return models.application_redact.update(
    {
      retryCount,
      status,
      success,
      data: Sequelize.fn(
        'jsonb_set',
        Sequelize.col('data'),
        Sequelize.literal(`'{sbi}'`),
        Sequelize.literal(`'"${REDACT_PII_VALUES.REDACTED_SBI}"'`),
        true
      ),
    },
    {
      where: { id },
      returning: true,
      ...options
    }
  )
}
