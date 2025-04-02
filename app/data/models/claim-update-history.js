export const claimUpdateHistory = (sequelize, DataTypes) => {
  const model = sequelize.define(
    'claim_update_history',
    {
      applicationReference: DataTypes.STRING,
      reference: DataTypes.STRING,
      note: DataTypes.STRING,
      updatedProperty: DataTypes.STRING,
      newValue: DataTypes.STRING,
      oldValue: DataTypes.STRING,
      eventType: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      createdBy: DataTypes.STRING
    },
    {
      tableName: 'claim_update_history',
      updatedAt: false
    }
  )

  model.associate = function (models) {
    model.hasOne(models.application, {
      sourceKey: 'applicationReference',
      foreignKey: 'reference'
    })
  }

  return model
}
