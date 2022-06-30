const { models } = require('../data')
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
/**
 * Search application by Search Type and Search Text.
 * Currently Support Status, SBI number, Application Reference Number
 *
 * @param {string} searchText contain status, sbi number or application reference number
 * @param {*} searchType contain any of keyword ['status','ref','sbi']
 * @param {*} offset index of row where page should start from
 * @param {*} limit page limit
 * @returns all application with page
 */
async function searchApplications (searchText, searchType, offset = 0, limit = 10) {
  let query = {
  }
  let total = 0
  let applications = []
  if (searchText) {
    switch (searchType) {
      case 'sbi':
        query.where = { 'data.organisation.sbi': searchText }
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
  total = await models.application.count(query)
  if (total > 0) {
    query = {
      ...query,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    }
    if (searchType !== 'status') {
      query.include = [
        {
          model: models.status,
          attributes: ['status']
        }
      ]
    }
    applications = await models.application.findAll(query)
  }
  return {
    applications, total
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
  getByEmail,
  getApplicationCount,
  getAll,
  set,
  updateById,
  updateByReference,
  searchApplications
}
