const createReference = require('../../lib/create-reference')
const sendChangedApplicationEvent = require('../../events')
const applicationChangedState = require('../../lib/application-changed-state')

module.exports = (sequelize, DataTypes) => {
  const application = sequelize.define('application', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      autoIncrement: true,
      defaultValue: sequelize.UUIDV4,
    },
    reference: {
      type: DataTypes.STRING,
      set (val) {
        this.setDataValue('reference', val.toUpperCase())
      }
    },
    data: DataTypes.JSONB,
    claimed: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdBy: { type: DataTypes.STRING, defaultValue: 'admin' },
    updatedBy: { type: DataTypes.STRING, defaultValue: 'admin' },
    statusId: DataTypes.SMALLINT
  }, {
    freezeTableName: true,
    tableName: 'application',
    hooks: {
      afterCreate: async (applicationRecord, _) => {
        applicationRecord.dataValues.reference = createReference(applicationRecord.id)
        await applicationRecord.update(applicationRecord.dataValues)
      },
      afterUpdate: async (applicationRecord, _) => {
        const { originalState, newState } = applicationChangedState(applicationRecord)
        sendChangedApplicationEvent(applicationRecord.reference, originalState, newState)
      }

    }
  })
  application.associate = function (models) {
    application.hasOne(models.vetVisit, {
      sourceKey: 'reference',
      foreignKey: 'applicationReference'
    })
    application.hasOne(models.status, {
      sourceKey: 'statusId',
      foreignKey: 'statusId'
    })
    application.hasOne(models.payment, {
      sourceKey: 'reference',
      foreignKey: 'applicationReference'
    })
  }
  return application
}
