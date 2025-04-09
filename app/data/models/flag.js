export const flag = (sequelize, DataTypes) => {
  const flagModel = sequelize.define(
    'flag',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        autoIncrement: true,
        defaultValue: sequelize.UUIDV4
      },
      applicationReference: {
        type: DataTypes.STRING,
        set (val) {
          this.setDataValue('applicationReference', val.toUpperCase())
        }
      },
      sbi: DataTypes.STRING,
      note: DataTypes.STRING,
      createdBy: DataTypes.STRING,
      createdAt: { type: DataTypes.DATE },
      appliesToMh: { type: DataTypes.BOOLEAN, defaultValue: false },
      deletedAt: { type: DataTypes.DATE, defaultValue: null },
      deletedBy: { type: DataTypes.STRING, defaultValue: null }
    },
    {
      freezeTableName: true,
      tableName: 'flag',
      updatedAt: false
    })

  flagModel.associate = function (models) {
    flagModel.hasOne(models.application, {
      sourceKey: 'applicationReference',
      foreignKey: 'reference'
    })
  }

  return flagModel
}
