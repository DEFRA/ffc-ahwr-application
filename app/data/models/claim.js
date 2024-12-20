const { createClaimReference } = require('../../lib/create-reference')
const { mappedClaimType } = require('../../constants/claim')

const afterCreate = async (claimRecord, _) => {
  const typeOfClaimAsLetter = claimRecord.type
  const typeOfClaim = mappedClaimType[typeOfClaimAsLetter]
  const typeOfLivestock = claimRecord.dataValues.data.typeOfLivestock
  claimRecord.dataValues.reference = createClaimReference(claimRecord.dataValues.reference, typeOfClaim, typeOfLivestock)
  claimRecord.dataValues.updatedBy = 'admin'
  claimRecord.dataValues.updatedAt = new Date()
  await claimRecord.update(claimRecord.dataValues)
}

const claim = (sequelize, DataTypes) => {
  const Claim = sequelize.define('claim',
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
      tableName: 'claim',
      hooks: {
        afterCreate
      }
    }
  )
  Claim.associate = function (models) {
    Claim.hasOne(models.application, {
      sourceKey: 'applicationReference',
      foreignKey: 'reference'
    })
    Claim.hasOne(models.status, {
      sourceKey: 'statusId',
      foreignKey: 'statusId'
    })
  }
  return Claim
}

module.exports = { claim, afterCreate }
