import { buildData } from '../data'

const { models } = buildData

export const getAllByApplicationReference = async (applicationReference) => {
  const result = await models.contact_history.findAll({
    where: {
      applicationReference: applicationReference.toUpperCase()
    },
    order: [['createdAt', 'DESC']]
  })
  return result
}

export const set = async (data) => {
  const result = await models.contact_history.create(data)
  return result
}
