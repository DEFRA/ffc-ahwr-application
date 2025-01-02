import { buildData } from '../app/data'

const { models, sequelize } = buildData

export const truncate = async () => {
  await models.application.destroy({ truncate: { cascade: true } })
}

export const close = async () => {
  await sequelize.close()
}
