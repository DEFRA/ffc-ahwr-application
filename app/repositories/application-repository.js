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
      where: { 'data.organisation.email': email.toLowerCase() },
      include: [{
        model: models.vetVisit
      }]
    })
}

async function getAll (page = 0) {
  return models.application.findAll(
    {
      order: [['createdAt', 'DESC']],
      limit: 20,
      offset: page
    })
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
  getAll,
  set,
  updateById,
  updateByReference
}
