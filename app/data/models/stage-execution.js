export const stageExecution = (sequelize, DataTypes) => {
  const StageExecution = sequelize.define('stage_execution', {
    id: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    applicationReference: {
      type: DataTypes.STRING,
      allowNull: false
    },
    claimOrApplication: {
      type: DataTypes.STRING,
      allowNull: true
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
  StageExecution.associate = function (models) {
    StageExecution.hasMany(models.application, {
      sourceKey: 'applicationReference',
      foreignKey: 'reference'
    })
    StageExecution.hasMany(models.stage_configuration, {
      sourceKey: 'stageConfigurationId',
      foreignKey: 'id'
    })
  }

  return StageExecution
}
