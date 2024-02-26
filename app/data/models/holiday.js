module.exports = (sequelize, DataTypes) => {
    const holiday = sequelize.define('holiday', {
        date: {
          type: DataTypes.DATE,
          primaryKey: true
        },
        description: {
            type: DataTypes.STRING
        }
    })
    return holiday
  }
  