const createReference = require('../../lib/create-reference')
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
    data: DataTypes.STRING,
    createdAt: { type: DataTypes.DATE, defaultValue: Date.now() },
    updatedAt: { type: DataTypes.DATE, defaultValue: null },
    createdBy: DataTypes.STRING,
    updatedBy: { type: DataTypes.STRING, defaultValue: null }
  }, {
    freezeTableName: true,
    tableName: 'application',
    hooks: {
      afterCreate: async (applicationRecord, _) => {
        applicationRecord.dataValues.reference = createReference(applicationRecord.id)
        applicationRecord.dataValues.updatedBy = 'admin'
        applicationRecord.dataValues.updatedAt = new Date()
        await applicationRecord.update(applicationRecord.dataValues)
      }
    }
  })
  application.associate = function (models) {
    application.hasOne(models.vetVisit, {
      sourceKey: 'reference',
      foreignKey: 'applicationReference'
    })
  }
  return application
}
