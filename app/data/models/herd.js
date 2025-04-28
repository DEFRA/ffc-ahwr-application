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
        primaryKey: true,
        allowNull: false
      },
      applicationReference: {
        type: DataTypes.STRING,
        allowNull: false,
        set(val) {
          this.setDataValue('applicationReference', val.toUpperCase())
        }
      },
      herdName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      cph: {
        type: DataTypes.STRING,
        allowNull: false
      },
      othersOnSameCph: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
      herdReasons: {
        type: DataTypes.STRING,
        allowNull: false
      },
      isCurrent: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedBy: {
        type: DataTypes.STRING,
        defaultValue: null
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: null
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
