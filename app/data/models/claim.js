const createAgreementNumber = require('../../lib/create-agreement-number')

module.exports = (sequelize, DataTypes) => {
  const claim = sequelize.define('claim',
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
      createdAt: { type: DataTypes.DATE, defaultValue: Date.now() },
      updatedAt: { type: DataTypes.DATE, defaultValue: null },
      createdBy: DataTypes.STRING,
      updatedBy: { type: DataTypes.STRING, defaultValue: null }
    },
    {
      freezeTableName: true,
      tableName: 'claim',
      hooks: {
        afterCreate: async (claimRecord, _) => {
          claimRecord.dataValues.reference = createAgreementNumber('claim', { id: claimRecord?.id, type: claimRecord?.type, typeOfLivestock: claimRecord?.dataValues?.data?.typeOfLivestock })
          claimRecord.dataValues.updatedBy = 'admin'
          claimRecord.dataValues.updatedAt = new Date()
          await claimRecord.update(claimRecord.dataValues)
        }
      }
    }
  )
  claim.associate = function (models) {
    claim.hasOne(models.application, {
      sourceKey: 'applicationReference',
      foreignKey: 'reference'
    })
    claim.hasOne(models.status, {
      sourceKey: 'statusId',
      foreignKey: 'statusId'
    })
  }
  return claim
}
