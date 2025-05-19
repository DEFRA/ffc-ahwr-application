import { buildData } from '../data/index.js'

const { models } = buildData

export const createHerd = async (data) => {
  return models.herd.create(data)
}

export const getHerdById = async (id) => {
  return models.herd.findOne({
    where: { id }
  })
}

export const updateIsCurrentHerd = async (id, isCurrent) => {
  return models.herd.update(
    { isCurrent },
    { where: { id } }
  )
}

export const getHerdsByAppRefAndSpecies = async (applicationReference, species) => {
  return models.herd.findAll({
    where: { applicationReference, species, isCurrent: true }
  })
}
