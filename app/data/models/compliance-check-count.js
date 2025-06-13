export const complianceCheckCount = (sequelize, DataTypes) => {
  const complianceCheckCountModel = sequelize.define(
    'complianceCheckCount',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        defaultValue: 1
      },
      count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE
    },
    {
      freezeTableName: true,
      tableName: 'compliance_check_count'
    })

  return complianceCheckCountModel
}
