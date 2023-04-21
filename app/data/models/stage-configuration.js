
module.exports = (sequelize, DataTypes) => {
  const stageConfiguration = sequelize.define('stageConfiguration', {
    id: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      autoIncrement: true,
      defaultValue: sequelize.UUIDV4
    },
    stage: DataTypes.STRING,
    role: DataTypes.JSONB,
    stepNumber: DataTypes.SMALLINT,
    action: DataTypes.JSONB
  }, {
    freezeTableName: true,
    tableName: 'stage_configuration',
    timestamps: false
  })
  stageConfiguration.associate = function (models) {
    stageConfiguration.hasMany(models.stageExecution, {
      sourceKey: 'id',
      stageConfigurationId: 'applicationReference'
    })
  }
  return stageConfiguration
}
