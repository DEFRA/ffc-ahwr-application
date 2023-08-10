const { models, sequelize } = require('../data')
const { Op } = require('sequelize')
const eventPublisher = require('../event-publisher')

/**
 * Get application by reference number
 * @param {string} reference
 * @returns application object with status.
 */
async function get (reference) {
  return models.application.findOne(
    {
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
 * Get latest applications for Single Business Identifier (SBI)
 *
 * @param {number} sbi
 * @returns latest applications for each SBI number
 *
 * Example result:
  [
    {
      "id": "eaf9b180-9993-4f3f-a1ec-4422d48edf92",
      "reference": "AHWR-5C1C-DD6A",
      "data": {
        "reference": "string",
        "declaration": true,
        "offerStatus": "accepted",
        "whichReview": "sheep",
        "organisation": {
          "crn": 112222,
          "sbi": 112222,
          "name": "My Amazing Farm",
          "email": "business@email.com",
          "address": "1 Example Road",
          "farmerName": "Mr Farmer"
        },
        "eligibleSpecies": "yes",
        "confirmCheckDetails": "yes"
      },
      "claimed": false,
      "createdAt": "2023-01-17 13:55:20",
      "updatedAt": "2023-01-17 13:55:20",
      "createdBy": "David Jones",
      "updatedBy": "David Jones",
      "statusId": 1
    }
  ]
 */
async function getLatestApplicationsBySbi (sbi) {
  console.log(`${new Date().toISOString()} Getting latest applications by: ${JSON.stringify({
    sbi
  })}`)
  const result = await models.application
    .findAll(
      {
        where: { 'data.organisation.sbi': sbi },
        order: [['createdAt', 'DESC']],
        raw: true
      })
  return result.sort((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b)
}

/**
 * Get the latest application by Single Business Identifier (SBI) number.
 *
 * @param {number} sbi
 * @returns application object.
 */
async function getBySbi (sbi) {
  return models.application.findOne({
    where: {
      'data.organisation.sbi': sbi
    },
    order: [['createdAt', 'DESC']]
  })
}

/**
 * Get application by email
 * @param {string} email
 * @returns application object with vetVisit data.
 */
async function getByEmail (email) {
  return models.application.findOne(
    {
      order: [['createdAt', 'DESC']],
      where: { 'data.organisation.email': email.toLowerCase() }
    })
}

function evalSortField (sort) {
  if (sort && sort.field) {
    switch (sort.field.toLowerCase()) {
      case 'status':
        return [models.status, sort.field.toLowerCase(), sort.direction ?? 'ASC']
      case 'apply date':
        return ['createdAt', sort.direction ?? 'ASC']
      case 'sbi':
        return ['data.organisation.sbi', sort.direction ?? 'ASC']
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
 * @param {array} filter contains array of status ['CLAIMED','DATA INPUTED','APPLIED']
 * @param {integer} offset index of row where page should start from
 * @param {integer} limit page limit
 * @param {object} object contain field and direction for sort order
 * @returns all application with page
 */
async function searchApplications (searchText, searchType, filter, offset = 0, limit = 10, sort = { field: 'createdAt', direction: 'DESC' }) {
  let query = {
    include: [
      {
        model: models.status,
        attributes: ['status']
      }
    ]
  }
  let total = 0
  let applications = []
  let applicationStatus = []
  if (searchText) {
    switch (searchType) {
      case 'sbi':
        query.where = { 'data.organisation.sbi': searchText }
        break
      case 'organisation':
        query.where = { 'data.organisation.name': searchText }
        break
      case 'ref':
        query.where = { reference: searchText }
        break
      case 'status':
        query.include = [
          {
            model: models.status,
            attributes: ['status'],
            where: { status: searchText.toUpperCase() }
          }]
        break
    }
  }

  if (filter && filter.length > 0) {
    query.include = [
      {
        model: models.status,
        attributes: ['status'],
        where: { status: filter }
      }
    ]
  }

  total = await models.application.count(query)
  if (total > 0) {
    applicationStatus = await models.application.findAll({
      attributes: ['status.status', [sequelize.fn('COUNT', 'application.id'), 'total']],
      ...query,
      group: ['status.status'],
      raw: true
    })
    sort = evalSortField(sort)
    query = {
      ...query,
      order: [sort],
      limit,
      offset
    }
    applications = await models.application.findAll(query)
  }
  return {
    applications, total, applicationStatus
  }
}
/**
 * Get all applications
 * @returns
 */
async function getAll () {
  const query = {
    order: [['createdAt', 'DESC']]
  }
  return models.application.findAll(query)
}

/**
 * Get all applications that have been claimed
 * @param {*} claimStatusIds an array of status IDs which indicate that an application has been claimed
 * @returns a list of applications
 */
async function getAllClaimedApplications (claimStatusIds) {
  return models.application.findAll({
    where: {
      statusId: claimStatusIds //shorthand for IN operator
    }
  })
}

/**
 * Get total number of applications
 * @returns
 */
async function getApplicationsCount () {
  return models.application.count()
}

/**
 *
 * @param {*} data
 * @returns
 */
async function set (data) {
  const result = await models.application.create(data)
  eventPublisher.raise({
    message: 'New application has been created',
    application: result.dataValues,
    raisedBy: result.dataValues.createdBy,
    raisedOn: result.dataValues.createdAt
  })
  return result
}

/**
 * Update the record by reference.
 *
 * @param {object} data must contain the `reference` of the record to be
 * updated.
 * @return {Array} contains a single element, 1 equates to success, 0 equates
 * to failure.
 */
async function updateByReference (data) {
  const result = await models.application.update(
    data,
    {
      where: {
        reference: data.reference
      },
      returning: true
    }
  )
  for (let i = 0; i < result[0]; i++) {
    eventPublisher.raise({
      message: 'Application has been updated',
      application: result[1][i].dataValues,
      raisedBy: result[1][i].dataValues.updatedBy,
      raisedOn: result[1][i].dataValues.updatedAt
    })
  }
  return result
}

module.exports = {
  get,
  getBySbi,
  getLatestApplicationsBySbi,
  getByEmail,
  getAll,
  getApplicationsCount,
  set,
  updateByReference,
  searchApplications,
  getAllClaimedApplications
}
