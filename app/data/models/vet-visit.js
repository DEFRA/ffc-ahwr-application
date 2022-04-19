const createReference = require('../../lib/create-reference')
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('vetVisit', {
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
    applicationReference: DataTypes.STRING,
    rcvs: DataTypes.STRING,
    data: DataTypes.STRING,
    createdAt: { type: DataTypes.DATE, defaultValue: Date.now() },
    updatedAt: { type: DataTypes.DATE, defaultValue: null },
    createdBy: DataTypes.STRING,
    updatedBy: { type: DataTypes.STRING, defaultValue: null }
  }, {
    freezeTableName: true,
    tableName: 'vet_visit',
    hooks: {
      afterCreate: async (application, options) => {
        application.dataValues.reference = createReference(application.id)
        application.dataValues.updatedBy = 'admin'
        application.dataValues.updatedAt = new Date()
        await application.update(application.dataValues)
      }
    }
  })
}
