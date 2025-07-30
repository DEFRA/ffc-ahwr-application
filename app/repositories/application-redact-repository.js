import { buildData } from '../data/index.js'

const { models } = buildData

export const getApplicationsToRedactFor = async (requestedDate) => {
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

export const updateApplicationRedact = async (id, retryCount, status, success) => {
  return models.application_redact.update(
    { 
      retryCount, 
      status, 
      success 
    },
    { where: { id } }
  )
}
