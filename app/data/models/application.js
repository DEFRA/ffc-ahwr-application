module.exports = (sequelize, DataTypes) => {
  return sequelize.define('application', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    reference: {
      type: DataTypes.STRING,
      primaryKey: true,
      set (val) {
        this.setDataValue('reference', val.toUpperCase())
      }
    },
    type: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    data: DataTypes.STRING,
    createdAt: { type: DataTypes.DATE, defaultValue: Date.now() },
    updatedAt: { type: DataTypes.DATE, defaultValue: Date.now() },
    createdBy: DataTypes.STRING,
    updatedBy: DataTypes.STRING
  }, {
    freezeTableName: true,
    tableName: 'application'
  })
}
