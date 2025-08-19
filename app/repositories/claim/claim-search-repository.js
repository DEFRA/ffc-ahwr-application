import { startandEndDate } from '../../lib/date-utils.js'
import { Op } from 'sequelize'
import { buildData } from '../../data/index.js'

const { models } = buildData

const evalSortField = (sort) => {
  const direction = sort?.direction ?? 'ASC'
  const field = sort?.field?.toLowerCase()

  if (!field) {
    return ['createdAt', direction]
  }

  const orderBySortField = {
    status: [models.status, field, direction],
    'claim date': ['createdAt', direction],
    sbi: ['data.organisation.sbi', direction],
    'claim number': ['reference', direction],
    'type of visit': ['type', direction],
    species: ['data.typeOfLivestock', direction]
  }

  return orderBySortField[field] || ['createdAt', direction]
}

export const searchClaims = async (search, filter, offset, limit, sort = { field: 'createdAt', direction: 'DESC' }) => {
  if (search?.type && !['ref', 'appRef', 'type', 'species', 'status', 'sbi', 'date', 'reset'].includes(search.type)) {
    return { total: 0, claims: [] }
  }

  const query = {
    include: [
      {
        model: models.status,
        attributes: ['status']
      },
      {
        model: models.application,
        attributes: ['data']
      },
      {
        model: models.flag,
        as: 'flags',
        attributes: ['appliesToMh'],
        where: {
          deletedBy: null
        },
        required: false
      }
    ]
  }

  applySearchConditions(query, search)

  if (filter) {
    query.where = {
      ...query.where,
      [filter.field]: {
        [Op[filter.op]]: filter.value
      }
    }
  }

  const claims = await models.claim.findAll({
    ...query,
    order: [evalSortField(sort)],
    limit,
    offset
  })

  const total = await models.claim.count(query)

  const herdKeys = claims
    .map((claim) => {
      const { herdId, herdVersion } = claim.dataValues.data || {}
      return herdId && herdVersion ? `${herdId}::${herdVersion}` : null
    })
    .filter(Boolean)

  const uniqueKeys = [...new Set(herdKeys)]

  const herdWhere = {
    [Op.or]: uniqueKeys.map((key) => {
      const [id, version] = key.split('::')

      return {
        id,
        version
      }
    })
  }

  const herds = await models.herd.findAll({ where: herdWhere })

  const herdMap = new Map(
    herds.map((herd) => [`${herd.dataValues.id}::${herd.dataValues.version}`, herd.toJSON()])
  )

  const claimsWithHerd = claims.map((claim) => {
    const { herdId, herdVersion } = claim.dataValues.data || {}
    const herdKey = `${herdId}::${herdVersion}`
    const herd = herdMap.get(herdKey)

    return {
      ...claim.toJSON(),
      herd
    }
  })

  return {
    total,
    claims: claimsWithHerd
  }
}

const applySearchConditions = (query, search) => {
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
