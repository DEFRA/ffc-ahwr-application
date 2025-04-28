export const herd = (sequelize, DataTypes) => {
  const herdModel = sequelize.define(
    'herd',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        autoIncrement: true,
        defaultValue: sequelize.UUIDV4
      },
      version: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      applicationReference: {
        type: DataTypes.STRING,
        allowNull: false,
        set(val) {
          this.setDataValue('applicationReference', val.toUpperCase())
        }
      },
      herdName: DataTypes.STRING,
      cph: DataTypes.STRING,
      othersOnSameCph: DataTypes.BOOLEAN,
      herdReasons: DataTypes.STRING,
      isCurrent: DataTypes.BOOLEAN,
      createdBy: DataTypes.STRING,
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedBy: DataTypes.STRING,
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    },
    {
      freezeTableName: true,
      tableName: 'herd',
      updatedAt: false
    }
  )

  herdModel.associate = function (models) {
    herdModel.belongsTo(models.application, {
      foreignKey: 'applicationReference',
      targetKey: 'reference',
      as: 'application'
    })
  }

  return herdModel
}
