module.exports = (sequelize, DataTypes) => sequelize.define('application', {
  applicationId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  reference: DataTypes.STRING
},
{
  tableName: 'application',
  freezeTableName: true,
  timestamps: false
})
