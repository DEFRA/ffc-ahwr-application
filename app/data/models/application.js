module.exports = (sequelize, DataTypes) => {
  return sequelize.define('application', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      autoIncrement: true,
      defaultValue: sequelize.UUIDV4
    },
    reference: {
      type: DataTypes.STRING,
      set (val) {
        this.setDataValue('reference', val.toUpperCase())
      }
    },
    data: DataTypes.STRING,
    createdAt: { type: DataTypes.DATE, defaultValue: Date.now() },
    updatedAt: { type: DataTypes.DATE, defaultValue: null },
    createdBy: DataTypes.STRING,
    updatedBy: { type: DataTypes.STRING, defaultValue: null }
  }, {
    freezeTableName: true,
    tableName: 'application'
  })
}
