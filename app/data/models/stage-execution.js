
module.exports = (sequelize, DataTypes) => {
  const stageExecution = sequelize.define('stageExecution', {
    id: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      autoIncrement: true,
      defaultValue: sequelize.UUIDV4
    },
    applicationReference: DataTypes.STRING,
    stageConfigurationId: DataTypes.SMALLINT,
    executedAt: { type: DataTypes.DATE, defaultValue: Date.now() },
    executedBy: DataTypes.STRING,
    processedAt: { type: DataTypes.DATE, defaultValue: null },
    action: DataTypes.JSONB
  }, {
    freezeTableName: true,
    tableName: 'stage_execution',
    timestamps: false
  })
  return stageExecution
}
