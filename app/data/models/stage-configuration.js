
module.exports = (sequelize, DataTypes) => {
  const stageConfiguration = sequelize.define('stage_configuration', {
    id: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      allowNull: false
    },
    stage: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    stepNumber: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    action: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  },
  {
    freezeTableName: true,
    tableName: 'stage_configuration',
    timestamps: false
  })
  return stageConfiguration
}
