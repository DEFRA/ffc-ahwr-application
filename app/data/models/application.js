const createAgreementNumber = require('../../lib/create-agreement-number')

module.exports = (sequelize, DataTypes) => {
  const application = sequelize.define('application', {
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
    createdAt: { type: DataTypes.DATE, defaultValue: Date.now() },
    updatedAt: { type: DataTypes.DATE, defaultValue: null },
    createdBy: DataTypes.STRING,
    updatedBy: { type: DataTypes.STRING, defaultValue: null },
    statusId: DataTypes.SMALLINT,
    type: DataTypes.STRING
  }, {
    freezeTableName: true,
    tableName: 'application',
    hooks: {
      afterCreate: async (applicationRecord, _) => {
        applicationRecord.dataValues.reference =  createAgreementNumber('apply', { id: applicationRecord.id })
        applicationRecord.dataValues.updatedBy = 'admin'
        applicationRecord.dataValues.updatedAt = new Date()
        await applicationRecord.update(applicationRecord.dataValues)
      }
    }
  })
  application.associate = function (models) {
    application.hasOne(models.status, {
      sourceKey: 'statusId',
      foreignKey: 'statusId'
    })
  }
  return application
}
