module.exports = (sequelize, DataTypes) => {
  const application = sequelize.define('application', {
    applicationId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    reference: DataTypes.STRING
  },
  {
    tableName: 'application',
    freezeTableName: true,
    timestamps: false
  })
  return application
}
