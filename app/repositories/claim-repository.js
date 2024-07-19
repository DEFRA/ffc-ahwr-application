const { models, sequelize } = require('../data')
const eventPublisher = require('../event-publisher')
const { startandEndDate } = require('../lib/date-utils')
const { Op } = require('sequelize')

/**
 * Get claim by reference number
 * @param {string} reference
 * @returns claim object with status.
 */
async function getByReference (reference) {
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

/**
 * Get claims by applicationReference number
 * @param {string} applicationReference
 * @returns an array of claims object with their statuses.
 */
async function getByApplicationReference (applicationReference) {
  const result = await models.claim.findAll({
    where: { applicationReference: applicationReference.toUpperCase() },
    include: [
      {
        model: models.status,
        attributes: ['status']
      }
    ],
    order: [['createdAt', 'DESC']]
  })

  return result.sort((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? a : b))
}

/**
 *
 * @param {*} data
 * @returns
 */
async function set (data) {
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

/**
 *
 * @param {*} data
 * @returns
 */
async function updateByReference (data) {
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

/**
 * Get all claims that have been claimed
 * @param {*} claimStatusIds an array of status IDs which indicate that an claim has been claimed
 * @returns a list of claims
 */
async function getAllClaimedClaims (claimStatusIds) {
  return models.claim.count({
    where: {
      statusId: claimStatusIds // shorthand for IN operator
    }
  })
}
/**
 * Get a boolean value indicating if the URN number is unique
 * @param {number} SBI
 * @param {string} laboratoryURN
 * @returns {boolean} isURNUnique
 */
async function isURNNumberUnique (sbi, laboratoryURN) {
  const applications = await models.application.findAll({ where: { 'data.organisation.sbi': sbi } })

  if (!applications) return { isURNUnique: true }
  if (applications.find((application) => application.dataValues?.data?.urnResult === laboratoryURN)) return { isURNUnique: false }

  const applicationsReferences = applications.map((application) => application.dataValues.reference)
  const claims = await models.claim.findAll({ where: { applicationReference: applicationsReferences, 'data.laboratoryURN': laboratoryURN } })

  return { isURNUnique: claims.length === 0 }
}
function evalSortField (sort) {
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
/**
 * Search application by Search Type and Search Text.
 * Currently Support Status, SBI number, Application Reference Number
 *
 * @param {string} searchText contain status, sbi number or application reference number
 * @param {string} searchType contain any of keyword ['status','ref','sbi']
 * @param {integer} offset index of row where page should start from
 * @param {integer} limit page limit
 * @param {object} object contain field and direction for sort order
 * @returns all claims with page
 */
async function searchClaims (searchText, searchType, offset = 0, limit = 10, sort = { field: 'createdAt', direction: 'DESC' }) {
  let query = {
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
  let total = 0
  let claims = []
  let claimStatus = []

  if (!['ref', 'type', 'species', 'status', 'sbi', 'date', 'reset'].includes(searchType)) return { claims, total, claimStatus }
  if (searchText) {
    switch (searchType) {
      case 'ref':
        query.where = { reference: searchText }
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
            where: { status: searchText }
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

  total = await models.claim.count(query)
  if (total > 0) {
    claimStatus = await models.claim.findAll({
      attributes: ['status.status', [sequelize.fn('COUNT', 'claim.id'), 'total']],
      ...query,
      group: ['status.status', 'application.data'],
      raw: true
    })
    sort = evalSortField(sort)
    query = {
      ...query,
      order: [sort],
      limit,
      offset
    }
    claims = await models.claim.findAll(query)
  }
  return {
    claims, total, claimStatus
  }
}

module.exports = {
  set,
  searchClaims,
  getByReference,
  isURNNumberUnique,
  updateByReference,
  getAllClaimedClaims,
  getByApplicationReference
}
