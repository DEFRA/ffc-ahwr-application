import { Sequelize, DataTypes } from 'sequelize'
import { dbConfig } from '../config/db.js'
import { application } from './models/application.js'
import { claim } from './models/claim.js'
import { contactHistory } from './models/contact-history.js'
import { holiday } from './models/holiday.js'
import { stageConfiguration } from './models/stage-configuration.js'
import { stageExecution } from './models/stage-execution.js'
import { status } from './models/status.js'

export const buildData = (() => {
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
