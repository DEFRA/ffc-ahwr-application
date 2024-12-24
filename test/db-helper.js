const { models, sequelize } = require('../app/data').default

async function truncate () {
  await models.application.destroy({ truncate: { cascade: true } })
}

async function close () {
  await sequelize.close()
}

module.exports = {
  close,
  truncate
}
