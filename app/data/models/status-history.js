export const statusHistory = (sequelize, DataTypes) => {
  const model = sequelize.define(
    'status_history',
    {
      reference: DataTypes.STRING,
      note: DataTypes.STRING,
      statusId: DataTypes.STRING,
      createdAt: DataTypes.DATE,
      createdBy: DataTypes.STRING
    },
    {
      freezeTableName: true,
      tableName: 'status_history',
      updatedAt: false
    }
  )

  return model
}
