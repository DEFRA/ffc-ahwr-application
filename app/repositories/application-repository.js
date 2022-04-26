const { models } = require('../data')

async function get (reference) {
  return models.application.findOne(
    {
      attributes: ['id', 'reference', 'data', 'createdAt', 'updatedAt', 'updatedBy', 'createdBy'],
      where: { reference: reference.toUpperCase() },
      include: [{ model: models.vetVisit }]
    })
}
async function getAll (page = 0) {
  return models.application.findAll(
    {
      attributes: ['id', 'reference', 'data', 'createdAt', 'updatedAt', 'updatedBy', 'createdBy'],
      order: [['createdAt', 'DESC']],
      limit: 20,
      offset: page
    })
}
async function set (data) {
  return models.application.create(data)
}
async function update (data) {
  return models.application.update(data,
    { where: { id: data.id } })
}

module.exports = { get, set, getAll, update }
