module.exports = (sequelize, DataTypes) => {
  const holiday = sequelize.define('holiday', {
    date: {
      type: DataTypes.STRING,
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
  return holiday
}
