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
  }, {
    freezeTableName: true,
    tableName: 'stage_execution',
    timestamps: false
  })
  stageExecution.associate = function (models) {
    stageExecution.hasMany(models.application, {
      sourceKey: 'applicationReference',
      foreignKey: 'reference'
    })
    stageExecution.hasMany(models.stage_configuration, {
      sourceKey: 'stageConfigurationId',
      foreignKey: 'id'
    })
  }

  return stageExecution
}
