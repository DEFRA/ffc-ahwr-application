export const claim = (sequelize, DataTypes) => {
  const claimModel = sequelize.define('claim',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        autoIncrement: true,
        defaultValue: sequelize.UUIDV4
      },
      reference: {
        type: DataTypes.STRING,
        defaultValue: '',
        set (val) {
          this.setDataValue('reference', val.toUpperCase())
        }
      },
      applicationReference: {
        type: DataTypes.STRING,
        set (val) {
          this.setDataValue('applicationReference', val.toUpperCase())
        }
      },
      data: DataTypes.JSONB,
      statusId: DataTypes.SMALLINT,
      type: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      createdBy: DataTypes.STRING,
      updatedBy: { type: DataTypes.STRING, defaultValue: null }
    },
    {
      freezeTableName: true,
      tableName: 'claim'
    }
  )
  claimModel.associate = function (models) {
    claimModel.hasOne(models.application, {
      sourceKey: 'applicationReference',
      foreignKey: 'reference'
    })
    claimModel.hasOne(models.status, {
      sourceKey: 'statusId',
      foreignKey: 'statusId'
    })
    claimModel.hasMany(models.flag, {
      foreignKey: 'applicationReference',
      sourceKey: 'applicationReference',
      as: 'flags'
    })
  }
  return claimModel
}
