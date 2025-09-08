import { Sequelize } from 'sequelize'
import { buildData } from '../data/index.js'
import crypto from 'crypto'

const { models } = buildData

const MIN_SBI = 1000000000
const MAX_SBI = 9999999999

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

export const updateApplicationRedact = async (id, retryCount, status, success, redactedSbi, options = {}) => {
  return models.application_redact.update(
    {
      retryCount,
      status,
      success,
      ...(redactedSbi !== undefined && {
        data: Sequelize.literal(
         `jsonb_set("data", '{sbi}', '"${redactedSbi}"')`
        )
      })
    },
    {
      where: { id },
      returning: true,
      ...options
    }
  )
}

const sbiExists = async (value) => {
  const result = await models.application_redact.findOne({
    where: { redactedSbi: value }
  })
  return result !== null
}

export const generateRandomUniqueSbi = async () => {
  let sbi
  let exists = true
  while (exists) {
    sbi = crypto.randomInt(MIN_SBI, MAX_SBI + 1).toString()
    exists = await sbiExists(sbi)
  }

  return sbi
}
