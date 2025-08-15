export const holiday = (sequelize, DataTypes) => {
  return sequelize.define('holiday', {
    date: {
      type: DataTypes.DATE,
      primaryKey: true
    },
    description: {
      type: DataTypes.STRING
    }
  },
  {
    freezeTableName: true,
    tableName: 'holiday',
    timestamps: false
  })
}
