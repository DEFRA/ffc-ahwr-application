const status = (sequelize, DataTypes) => {
  const Status = sequelize.define('status', {
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
  Status.associate = function (models) {
    Status.hasMany(models.application, {
      foreignKey: 'statusId'
    })
  }
  return Status
}

module.exports = { status }
