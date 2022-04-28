module.exports = (sequelize, DataTypes) => {
  const vetVisit = sequelize.define('vetVisit', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      autoIncrement: true,
      defaultValue: sequelize.UUIDV4
    },
    applicationReference: DataTypes.STRING,
    data: DataTypes.JSONB,
    createdAt: { type: DataTypes.DATE, defaultValue: Date.now() },
    updatedAt: { type: DataTypes.DATE, defaultValue: null },
    createdBy: DataTypes.STRING,
    updatedBy: { type: DataTypes.STRING, defaultValue: null }
  }, {
    freezeTableName: true,
    tableName: 'vet_visit'
  })
  vetVisit.associate = function (models) {
    vetVisit.belongsTo(models.application, {
      foreignKey: 'applicationReference'
    })
  }
  return vetVisit
}
