const { models } = require('../data')

async function get (reference) {
  const existingData =
        await models.application.findOne(
          {
            attributes: ['id', 'reference', 'type', 'data', 'createdAt'],
            where: { reference },
            order: [['created_at', 'DESC']]
          })
  if (existingData) {
    console.info(`Got application: ${existingData.id}`)
  }
  return existingData
}
async function getAll (page = 0) {
  const existingData =
        await models.application.findAll(
          {
            attributes: ['id', 'reference', 'type', 'data', 'createdAt'],
            order: [['created_at', 'DESC']],
            limit: 20,
            offset: page
          })
  return existingData
}
async function set (data) {
  await models.application.create(data)
}

module.exports = { get, set, getAll }
