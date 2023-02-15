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

module.exports = { getPendingApplications, update }
