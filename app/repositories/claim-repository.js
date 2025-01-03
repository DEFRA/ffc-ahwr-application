import { buildData } from '../data/index.js'
import eventPublisher from '../event-publisher/index.js'
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
  eventPublisher.raiseClaimEvents({
    message: 'New claim has been created',
    claim: result.dataValues,
    raisedBy: result.dataValues.createdBy,
    raisedOn: result.dataValues.createdAt
  }, sbi)
  return result
}

export const updateClaimByReference = async (data) => {
  try {
    const claim = await models.claim.findOne({
      where: {
        reference: data.reference
      },
      returning: true
    })

    if (claim?.dataValues?.statusId === data?.statusId) return claim

    const result = await models.claim.update(data, {
      where: {
        reference: data.reference
      },
      returning: true
    })

    const updatedRows = result[0] // Number of affected rows
    const updatedRecords = result[1] // Assuming this is the array of updated records
    const sbi = data.sbi

    for (let i = 0; i < updatedRows; i++) {
      const updatedRecord = updatedRecords[i]
      eventPublisher.raiseClaimEvents({
        message: 'Claim has been updated',
        claim: updatedRecord.dataValues,
        raisedBy: updatedRecord.dataValues.updatedBy,
        raisedOn: updatedRecord.dataValues.updatedAt
      }, sbi)
    }
    return result
  } catch (error) {
    console.error('Error updating claim by reference:', error)
    throw error // re-throw the error after logging or handle it as needed
  }
}

export const getAllClaimedClaims = async (claimStatusIds) => {
  return await models.claim.count({
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

export const searchClaims = async (searchText, searchType, offset = 0, limit = 10, sort = { field: 'createdAt', direction: 'DESC' }) => {
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

  if (!['ref', 'appRef', 'type', 'species', 'status', 'sbi', 'date', 'reset'].includes(searchType)) return { total: 0, claims: [] }

  if (searchText) {
    switch (searchType) {
      case 'ref':
        query.where = { reference: searchText }
        break
      case 'appRef':
        query.where = { applicationReference: searchText }
        break
      case 'type':
        query.where = { type: searchText }
        break
      case 'species':
        query.where = { 'data.typeOfLivestock': searchText }
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
            where: { status: { [Op.iLike]: `%${searchText}%` } }
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
            where: { 'data.organisation.sbi': searchText }
          }]
        break
      case 'date':
        query.where = {
          createdAt: {
            [Op.gte]: startandEndDate(searchText).startDate,
            [Op.lt]: startandEndDate(searchText).endDate
          }
        }
        break
    }
  }

  return {
    total: await models.claim.count(query),
    claims: await models.claim.findAll({ ...query, order: [evalSortField(sort)], limit, offset })
  }
}
