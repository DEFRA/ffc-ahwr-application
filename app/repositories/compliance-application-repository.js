const { models } = require('../data')

async function getPendingApplications () {
  return await models.complianceApplication.findAll({
    where: {
      processed: false
    }
  })
}

async function update (data, id) {
  return models.complianceApplication.update(data, {
    where: { id }
  })
}

/**
 *
 * @param {*} data
 * @returns
 */
async function set (data) {
  return models.complianceApplication.create(data)
}

module.exports = { getPendingApplications, update, set }
