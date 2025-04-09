import { buildData } from '../data/index.js'

const { models } = buildData

export const createFlag = async (data) => {
  try {
    const result = await models.flag.create(data)
    return result
  } catch (error) {
    console.error('Error creating application flag: ', error)
    throw error
  }
}

export const getFlagByAppRef = async (appRef) => {
  try {
    const result = await models.flag.findOne({
      where: { applicationReference: appRef, deletedAt: null, deletedBy: null }
    })

    return result
  } catch (error) {
    console.error(
      'Error finding application flag by application reference: ',
      error
    )
    throw error
  }
}

export const getFlagByFlagId = async (flagId) => {
  try {
    const result = await models.flag.findOne({ where: { id: flagId } })

    return result
  } catch (error) {
    console.error('Error finding application flag by flag ID: ', error)
    throw error
  }
}

export const getFlagsForApplication = async (applicationReference) => {
  try {
    const result = await models.flag.findAll({
      where: { applicationReference, deletedAt: null, deletedBy: null }
    })

    return result.map(entry => entry.dataValues)
  } catch (error) {
    console.error('Error finding application flag by flag ID: ', error)
    throw error
  }
}

export const deleteFlag = async (flagId, user) => {
  try {
    await models.flag.update(
      { deletedAt: new Date(), deletedBy: user },
      { where: { id: flagId } }
    )
  } catch (error) {
    console.error('Error deleting application flag: ', error)
    throw error
  }
}
