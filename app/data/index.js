import { Sequelize, DataTypes } from 'sequelize'
import { dbConfig } from '../config/db'
import { application } from './models/application'
import { claim } from './models/claim'
import { contactHistory } from './models/contact-history'
import { holiday } from './models/holiday'
import { stageConfiguration } from './models/stage-configuration'
import { stageExecution } from './models/stage-execution'
import { status } from './models/status'

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
