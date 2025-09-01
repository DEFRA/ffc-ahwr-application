import { Sequelize } from 'sequelize'
import { buildData } from '../data/index.js'

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

export const updateApplicationRedact = async (id, retryCount, status, success, options = {}, redactedSbi) => {
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

export const generateRandomUniqueSBI = async () => {
  let sbi
  let exists = true
  while (exists) {
    sbi = Math.floor(1000000000 + Math.random() * 9000000000).toString()
    exists = await sbiExists(sbi)
  }

  return sbi
}
