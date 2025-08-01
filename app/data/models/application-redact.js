export const applicationRedact = (sequelize, DataTypes) => {
  const applicationRedactModel = sequelize.define(
    'application_redact',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        autoIncrement: true,
        defaultValue: sequelize.UUIDV4
      },
      requestedDate: {
        type: DataTypes.DATE,
        allowNull: false
      },
      reference: {
        type: DataTypes.STRING,
        allowNull: false,
        set (val) {
          this.setDataValue('reference', val.toUpperCase())
        }
      },
      data: DataTypes.JSONB,
      retryCount: {
        type: DataTypes.NUMBER,
        allowNull: false,
        defaultValue: 0
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true
      },
      success: {
        type: DataTypes.STRING,
        defaultValue: 'N'
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'admin'
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }
    },
    {
      freezeTableName: true,
      tableName: 'application_redact',
      updatedAt: false
    }
  )

  applicationRedactModel.associate = function (models) {
    applicationRedactModel.belongsTo(models.application, {
      foreignKey: 'reference',
      targetKey: 'reference',
      as: 'application'
    })
  }

  return applicationRedactModel
}
