import { buildData } from '../data/index.js'
import { raiseClaimEvents } from '../event-publisher/index.js'
import { startandEndDate } from '../lib/date-utils.js'
import { Op } from 'sequelize'

const { models } = buildData

export const getClaimByReference = (reference) => {
  return models.claim.findOne({
    where: { reference: reference.toUpperCase() },
    include: [
      {
        model: models.status,
        attributes: ['status']
      }
    ]
  })
}

export const getByApplicationReference = async (applicationReference, typeOfLivestock) => {
  let where = { applicationReference: applicationReference.toUpperCase() }

  if (typeOfLivestock) {
    where = { ...where, 'data.typeOfLivestock': typeOfLivestock }
  }

  const result = await models.claim.findAll({
    where,
    include: [
      {
        model: models.status,
        attributes: ['status']
      }
    ],
    order: [['createdAt', 'DESC']]
  })

  return result
}

export const setClaim = async (data) => {
  const sbi = data.sbi
  const result = await models.claim.create(data)
  await raiseClaimEvents({
    message: 'New claim has been created',
    claim: result.dataValues,
    raisedBy: result.dataValues.createdBy,
    raisedOn: result.dataValues.createdAt
  }, sbi)
  return result
}

export const updateClaimByReference = async (data, note, logger) => {
  try {
    const claim = await models.claim.findOne({
      where: {
        reference: data.reference
      }
    })

    if (claim?.dataValues?.statusId === data.statusId) return claim

    const result = await models.claim.update(data, {
      where: {
        reference: data.reference
      },
      returning: true
    })

    const updatedRecord = result[1][0]

    await raiseClaimEvents({
      message: 'Claim has been updated',
      claim: updatedRecord.dataValues,
      note,
      raisedBy: updatedRecord.dataValues.updatedBy,
      raisedOn: updatedRecord.dataValues.updatedAt
    }, data.sbi)
  } catch (err) {
    logger.setBindings({ err })
    throw err
  }
}

export const getAllClaimedClaims = async (claimStatusIds) => {
  return models.claim.count({
    where: {
      statusId: claimStatusIds // shorthand for IN operator
    }
  })
}

export const isURNNumberUnique = async (sbi, laboratoryURN) => {
  const applications = await models.application.findAll({ where: { 'data.organisation.sbi': sbi } })

  if (applications.find((application) => application.dataValues?.data?.urnResult?.toLowerCase() === laboratoryURN.toLowerCase())) return { isURNUnique: false }

  const applicationsReferences = applications.map((application) => application.dataValues.reference)
  const claims = await models.claim.findAll({ where: { applicationReference: applicationsReferences } })
  if (claims.find((claim) => claim.dataValues?.data?.laboratoryURN?.toLowerCase() === laboratoryURN.toLowerCase())) return { isURNUnique: false }

  return { isURNUnique: true }
}

const evalSortField = (sort) => {
  if (sort !== null && sort !== undefined && sort.field !== undefined) {
    switch (sort.field.toLowerCase()) {
      case 'status':
        return [models.status, sort.field.toLowerCase(), sort.direction ?? 'ASC']
      case 'claim date':
        return ['createdAt', sort.direction ?? 'ASC']
      case 'sbi':
        return ['data.organisation.sbi', sort.direction ?? 'ASC']
      case 'claim number':
        return ['reference', sort.direction ?? 'ASC']
      case 'type of visit':
        return ['type', sort.direction ?? 'ASC']
      case 'species':
        return ['data.typeOfLivestock', sort.direction ?? 'ASC']
    }
  }
  return ['createdAt', sort.direction ?? 'ASC']
}

export const searchClaims = async (search, filter, offset, limit, sort = { field: 'createdAt', direction: 'DESC' }) => {
  const query = {
    include: [
      {
        model: models.status,
        attributes: ['status']
      }, {
        model: models.application,
        attributes: ['data']
      }
    ]
  }

  if (!['ref', 'appRef', 'type', 'species', 'status', 'sbi', 'date', 'reset'].includes(search.type)) return { total: 0, claims: [] }

  if (search.text) {
    switch (search.type) {
      case 'ref':
        query.where = { reference: search.text }
        break
      case 'appRef':
        query.where = { applicationReference: search.text }
        break
      case 'type':
        query.where = { type: search.text }
        break
      case 'species':
        query.where = { 'data.typeOfLivestock': search.text }
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
            where: { status: { [Op.iLike]: `%${search.text}%` } }
          }]
        break
      case 'sbi':
        query.include = [
          {
            model: models.status,
            attributes: ['status']
          },
          {
            model: models.application,
            attributes: ['data'],
            where: { 'data.organisation.sbi': search.text }
          }]
        break
      case 'date':
        query.where = {
          createdAt: {
            [Op.gte]: startandEndDate(search.text).startDate,
            [Op.lt]: startandEndDate(search.text).endDate
          }
        }
        break
    }
  }

  if (filter) {
    query.where = {
      ...query.where,
      [filter.field]: {
        [Op[filter.op]]: filter.value
      }
    }
  }

  return {
    total: await models.claim.count(query),
    claims: await models.claim.findAll({ ...query, order: [evalSortField(sort)], limit, offset })
  }
}
