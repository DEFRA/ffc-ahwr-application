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

async function getAll (limit, offset, sbi) {
  const query = {
    order: [['createdAt', 'DESC']],
    limit: limit,
    offset: offset
  }
  if (sbi && sbi.trim().length > 0) {
    query.where = { 'data.organisation.sbi': sbi.trim() }
  }
  return models.application.findAll(query)
}
async function getApplicationCount (sbi) {
  const query = {
    order: [['createdAt', 'DESC']]
  }
  if (sbi && sbi.trim().length > 0) {
    query.where = { 'data.organisation.sbi': sbi.trim() }
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
  updateByReference
}
