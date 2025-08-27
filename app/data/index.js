import { Sequelize, DataTypes } from 'sequelize'
import { dbConfig } from '../config/db.js'
import { application } from './models/application.js'
import { applicationRedact } from './models/application-redact.js'
import { claim } from './models/claim.js'
import { contactHistory } from './models/contact-history.js'
import { holiday } from './models/holiday.js'
import { stageConfiguration } from './models/stage-configuration.js'
import { stageExecution } from './models/stage-execution.js'
import { status } from './models/status.js'
import { claimUpdateHistory } from './models/claim-update-history.js'
import { flag } from './models/flag.js'
import { herd } from './models/herd.js'
import { createNamespace } from 'cls-hooked'
import { statusHistory } from './models/status-history.js'
import { complianceCheckCount } from './models/compliance-check-count.js'
import { applicationUpdateHistory } from './models/application-update-history.js'

export const buildData = (() => {
  const namespace = createNamespace('transaction-namespace')
  Sequelize.useCLS(namespace)

  const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig)

  application(sequelize, DataTypes)
  applicationUpdateHistory(sequelize, DataTypes)
  applicationRedact(sequelize, DataTypes)
  claim(sequelize, DataTypes)
  claimUpdateHistory(sequelize, DataTypes)
  contactHistory(sequelize, DataTypes)
  holiday(sequelize, DataTypes)
  stageConfiguration(sequelize, DataTypes)
  stageExecution(sequelize, DataTypes)
  status(sequelize, DataTypes)
  flag(sequelize, DataTypes)
  herd(sequelize, DataTypes)
  statusHistory(sequelize, DataTypes)
  complianceCheckCount(sequelize, DataTypes)

  sequelize.models.application.associate(sequelize.models)
  sequelize.models.application_update_history.associate(sequelize.models)
  sequelize.models.application_redact.associate(sequelize.models)
  sequelize.models.claim.associate(sequelize.models)
  sequelize.models.claim_update_history.associate(sequelize.models)
  sequelize.models.contact_history.associate(sequelize.models)
  sequelize.models.stage_execution.associate(sequelize.models)
  sequelize.models.status.associate(sequelize.models)
  sequelize.models.flag.associate(sequelize.models)
  sequelize.models.herd.associate(sequelize.models)

  return {
    models: sequelize.models,
    sequelize
  }
})()
