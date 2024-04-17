module.exports = (sequelize, DataTypes) => {
  const contactHistory = sequelize.define('contact_history',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        autoIncrement: true,
        defaultValue: sequelize.UUIDV4
      },
      applicationReference: {
        type: DataTypes.STRING,
        defaultValue: '',
        set (val) {
          this.setDataValue('applicationReference', val.toUpperCase())
        }
      },
      claimReference: {
        type: DataTypes.STRING,
        defaultValue: null,
        set (val) {
          if (val) {
            this.setDataValue('claimReference', val.toUpperCase())
          }
        }
      },
      data: DataTypes.JSONB,
      sbi: DataTypes.MEDIUMINT.UNSIGNED,
      createdAt: { type: DataTypes.DATE, defaultValue: Date.now() },
      updatedAt: { type: DataTypes.DATE, defaultValue: null },
      createdBy: DataTypes.STRING,
      updatedBy: { type: DataTypes.STRING, defaultValue: null }
    },
    {
      freezeTableName: true,
      tableName: 'contact_history',
      hooks: {
        afterCreate: async (contactHistoryRecord, _) => {
          contactHistoryRecord.dataValues.updatedBy = 'admin'
          contactHistoryRecord.dataValues.updatedAt = new Date()
          await contactHistoryRecord.update(contactHistoryRecord.dataValues)
        }
      }
    }
  )
  contactHistory.associate = function (models) {
    contactHistory.hasOne(models.application, {
      sourceKey: 'applicationReference',
      foreignKey: 'reference'
    })
    contactHistory.hasOne(models.claim, {
      sourceKey: 'claimReference',
      foreignKey: 'reference'
    })
  }
  return contactHistory
}
