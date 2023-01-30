const { Op } = require('sequelize')
const { models, sequelize } = require('../data')
/**
 * Get application by reference number
 * @param {string} reference
 * @returns application object with vetVisit & status.
 */
async function get (reference) {
  return models.application.findOne(
    {
      where: { reference: reference.toUpperCase() },
      include: [{ model: models.vetVisit }, {
        model: models.status,
        attributes: ['status']
      }]
    })
}

/**
 * Get all applications by Single Business Identifier (SBI) numbers.
 *
 * @param {number} sbiNumbers
 * @returns an array of application objects.
 */
async function getAllBySbiNumbers (sbiNumbers) {
  console.log(`${new Date().toISOString()} Getting by SBI numbers: ${JSON.stringify(sbiNumbers)}`)
  let result = await models.application
    .findAll({
      attributes: [
        [sequelize.json('data.organisation.sbi'), 'sbi'],
        [sequelize.col('reference'), 'application.reference'],
        [sequelize.col('status.status'), 'application.status']
      ],
      where: {
        'data.organisation.sbi': {
          [Op.in]: sbiNumbers
        }
      },
      include: [
        {
          model: models.status,
          attributes: []
        }
      ],
      raw: true
    })
  result = Object.values(result.reduce((group, row) => {
    const { sbi } = row
    group[sbi] = group[sbi] ?? {
      sbi,
      applications: []
    }
    group[sbi].applications.push({
      reference: row['application.reference'],
      status: row['application.status']
    })
    return group
  }, {}))
  sbiNumbers.forEach(sbi => {
    if (result.map(row => row.sbi).indexOf(sbi.toString()) === -1) {
      result.push({
        sbi: `${sbi}`,
        applications: []
      })
    }
  })
  return result
}

/**
 * Get application by Single Business Identifier (SBI)
 *
 * @param {number} sbi
 * @returns application object.
 */
async function getBySbi (sbi) {
  return models.application.findOne({
    where: {
      'data.organisation.sbi': sbi
    }
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
      where: { 'data.organisation.email': email.toLowerCase() },
      include: [{
        model: models.vetVisit
      }]
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
 * Get All applicaitons
 * @param {*} sbi
 * @param {*} offset
 * @param {*} limit
 * @returns
 */
async function getAll () {
  const query = {
    order: [['createdAt', 'DESC']]
  }
  return models.application.findAll(query)
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
 * @param {*} sbi
 * @returns
 */
async function getApplicationCount (sbi) {
  const query = {}
  if (sbi) {
    query.where = { 'data.organisation.sbi': sbi }
  }
  return models.application.count(query)
}
/**
 *
 * @param {*} data
 * @returns
 */
async function set (data) {
  return models.application.create(data)
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
  return models.application.update(data,
    { where: { reference: data.reference } })
}

/**
 * Update the record by Id.
 *
 * @param {object} data must contain the `id` of the record to be updated.
 * @return {Array} contains a single element, 1 equates to success, 0 equates
 * to failure.
 */
async function updateById (data) {
  return models.application.update(data,
    { where: { id: data.id } })
}

module.exports = {
  get,
  getBySbi,
  getAllBySbiNumbers,
  getByEmail,
  getApplicationCount,
  getAll,
  getApplicationsCount,
  set,
  updateById,
  updateByReference,
  searchApplications
}
