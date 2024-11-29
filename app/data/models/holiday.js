const holiday = (sequelize, DataTypes) => {
  const Holiday = sequelize.define('holiday', {
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
  return Holiday
}

module.exports = { holiday }
