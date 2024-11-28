const { Sequelize, DataTypes } = require('sequelize')
const config = require('../config/db')
const { application } = require('./models/application')
const { claim } = require('./models/claim')
const { contactHistory } = require('./models/contact-history')
const { holiday } = require('./models/holiday')
const { stageConfiguration } = require('./models/stage-configuration')
const { stageExecution } = require('./models/stage-execution')
const { status } = require('./models/status')

const dbConfig = config[process.env.NODE_ENV]

module.exports = (() => {
  const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig)

  application(sequelize, DataTypes)
  claim(sequelize, DataTypes)
  contactHistory(sequelize, DataTypes)
  holiday(sequelize, DataTypes)
  stageConfiguration(sequelize, DataTypes)
  stageExecution(sequelize, DataTypes)
  status(sequelize, DataTypes)

  sequelize.models.application.associate(sequelize.models)
  sequelize.models.claim.associate(sequelize.models)
  sequelize.models.contact_history.associate(sequelize.models)
  sequelize.models.stage_execution.associate(sequelize.models)
  sequelize.models.status.associate(sequelize.models)

  return {
    models: sequelize.models,
    sequelize
  }
})()
