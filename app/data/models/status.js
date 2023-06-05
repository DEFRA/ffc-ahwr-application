module.exports = (sequelize, DataTypes) => {
  const status = sequelize.define('status', {
    statusId: {
      type: DataTypes.SMALLINT,
      primaryKey: true,
      autoIncrement: true,
      defaultValue: sequelize.UUIDV4
    },
    status: {
      type: DataTypes.STRING,
      set (val) {
        this.setDataValue('status', val.toUpperCase())
      }
    }
  }, {
    freezeTableName: true,
    tableName: 'status'
  })
  status.associate = function (models) {
    status.hasMany(models.application, {
      foreignKey: 'statusId'
    })
  }
  return status
}
