import { buildData } from '../data/index.js'

const { models } = buildData

export const createStatusHistory = async (data) => {
  return models.status_history.create(data)
}

export const getHistoryByReference = async (reference) => {
  return models.status_history.findAll({
    where: { reference }
  })
}
