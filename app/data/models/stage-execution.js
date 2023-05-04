const application = require('./application')
const stageConfiguration = require('./stage-configuration')

module.exports = (sequelize, DataTypes) => {
  const stageExecution = sequelize.define('stage_execution', {
    id: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      allowNull: false
    },
    applicationReference: {
      type: DataTypes.STRING,
      allowNull: false
    },
    stageConfigurationId: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    executedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.literal('NOW()')
    },
    executedBy: {
      type: DataTypes.STRING,
      allowNull: true
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    action: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  })

  // Define foreign key relationships
  stageExecution.belongsTo(application, {
    foreignKey: 'applicationReference',
    targetKey: 'reference',
    as: 'application'
  })

  stageExecution.belongsTo(stageConfiguration, {
    foreignKey: 'stageConfigurationId',
    targetKey: 'id',
    as: 'stageConfiguration'
  })

  module.exports = stageExecution
}
