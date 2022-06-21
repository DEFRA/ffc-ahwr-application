const { models } = require('../data')

async function get (reference) {
  return models.application.findOne(
    {
      where: { reference: reference.toUpperCase() },
      include: [{ model: models.vetVisit }]
    })
}

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
async function searchApplications (searchText, searchType, offset = 0, limit = 10) {
  let query = {}
  let total = 0
  let applications = []
  if (searchText) {
    switch (searchType) {
      case 'sbi':
        query.where = { 'data.organisation.sbi': searchText }
        break
      case 'ref':
        query.where = { 'data.reference': searchText }
        break
      case 'status':
        query.where = { 'data.status': searchText }
        break
    }
  }
  total = models.application.count(query)
  if (total > 0) {
    query = {
      ...query,
      order: [['createdAt', 'DESC']],
      limit,
      offset
    }
    applications = models.application.findAll(query)
  }
  return {
    applications, total
  }
}

async function getAll (sbi, offset = 0, limit = 10) {
  const query = {
    order: [['createdAt', 'DESC']],
    limit,
    offset
  }
  if (sbi) {
    query.where = { 'data.organisation.sbi': sbi }
  }
  return models.application.findAll(query)
}
async function getApplicationCount (sbi) {
  const query = {}
  if (sbi) {
    query.where = { 'data.organisation.sbi': sbi }
  }
  return models.application.count(query)
}
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
