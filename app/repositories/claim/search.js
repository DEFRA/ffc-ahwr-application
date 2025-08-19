import { startandEndDate } from '../../lib/date-utils.js'
import { Op } from 'sequelize'
import { buildData } from '../../data/index.js'

const { models } = buildData

export const applySearchConditions = (query, search) => {
  if (!search?.text || !search?.type) {
    return
  }

  const { text, type } = search

  switch (type) {
    case 'ref':
      query.where = { reference: text }
      break
    case 'appRef':
      query.where = { applicationReference: text }
      break
    case 'type':
      query.where = { type: text }
      break
    case 'species':
      query.where = { 'data.typeOfLivestock': text }
      break
    case 'status':
      query.include = [
        {
          model: models.application,
          attributes: ['data']
        },
        {
          model: models.status,
          attributes: ['status'],
          where: { status: { [Op.iLike]: `%${text}%` } }
        },
        {
          model: models.flag,
          as: 'flags',
          attributes: ['appliesToMh'],
          where: { deletedBy: null },
          required: false
        }
      ]
      break
    case 'sbi': {
      query.include = [
        {
          model: models.status,
          attributes: ['status']
        },
        {
          model: models.application,
          attributes: ['data'],
          where: { 'data.organisation.sbi': text }
        },
        {
          model: models.flag,
          as: 'flags',
          attributes: ['appliesToMh'],
          where: { deletedBy: null },
          required: false
        }
      ]
      break
    }
    case 'date': {
      const { startDate, endDate } = startandEndDate(text)
      query.where = {
        createdAt: {
          [Op.gte]: startDate,
          [Op.lt]: endDate
        }
      }
      break
    }
    default:
      break
  }
}
