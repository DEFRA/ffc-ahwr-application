module.exports = (sequelize, DataTypes) => {
  const complianceApplication = sequelize.define('complianceApplication', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      autoIncrement: true,
      defaultValue: sequelize.UUIDV4
    },
    applicationReference: DataTypes.STRING,
    statusId: DataTypes.SMALLINT,
    processed: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: Date.now() },
    updatedAt: { type: DataTypes.DATE, defaultValue: null }
  }, {
    freezeTableName: true,
    tableName: 'compliance_application'
  })
  complianceApplication.associate = function (models) {
    complianceApplication.belongsTo(models.application, {
      foreignKey: 'applicationReference'
    })
    complianceApplication.hasOne(models.status, {
      sourceKey: 'statusId',
      foreignKey: 'statusId'
    })
  }
  return complianceApplication
}
