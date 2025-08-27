export const application = (sequelize, DataTypes) => {
  const applicationModel = sequelize.define('application', {
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
    data: DataTypes.JSONB,
    claimed: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE },
    updatedAt: { type: DataTypes.DATE, defaultValue: null },
    createdBy: DataTypes.STRING,
    updatedBy: { type: DataTypes.STRING, defaultValue: null },
    statusId: DataTypes.SMALLINT,
    type: DataTypes.STRING,
    eligiblePiiRedaction: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    freezeTableName: true,
    tableName: 'application'
  })
  applicationModel.associate = function (models) {
    applicationModel.hasOne(models.status, {
      sourceKey: 'statusId',
      foreignKey: 'statusId'
    })

    applicationModel.hasMany(models.flag, {
      sourceKey: 'reference',
      foreignKey: 'applicationReference'
    })
  }

  return applicationModel
}
