const { models } = require('../data')

async function get (ref) {
  console.log(ref, 'referance')
  const existingData =
        await models.application.findOne(
          {
            attributes: ['id', 'reference', 'grantType', 'data', 'createdAt'],
            where: { reference: ref },
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
            attributes: ['id', 'reference', 'grantType', 'data', 'createdAt'],
            order: [['created_at', 'DESC']],
            limit: 20,
            offset: 0
          })
  if (existingData) {
    // console.info(`Got application: ${existingData}`)
  }
  return existingData
}
async function set (data) {
  // console.log(data, 'Set Repository')
  await models.application.create(data)
}

module.exports = { get, set, getAll }
