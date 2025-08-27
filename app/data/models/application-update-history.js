export const applicationUpdateHistory = (sequelize, DataTypes) => {
  const model = sequelize.define(
    'application_update_history',
    {
      applicationReference: DataTypes.STRING,
      note: DataTypes.STRING,
      updatedProperty: DataTypes.STRING,
      newValue: DataTypes.STRING,
      oldValue: DataTypes.STRING,
      eventType: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      createdBy: DataTypes.STRING
    },
    {
      tableName: 'application_update_history',
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
