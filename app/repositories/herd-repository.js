import { buildData } from '../data/index.js'
import { QueryTypes } from 'sequelize';

const { models, sequelize } = buildData

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

export const getHerdsByAppRefAndLivestock = async (applicationReference, typeOfLivestock) => {

  const herds = await sequelize.query(
    `SELECT DISTINCT h.*
     FROM herd h
     LEFT JOIN claim c ON c.data->>'herdId' = h.id::text
     WHERE h."applicationReference" = :applicationReference
     AND c.data->>'typeOfLivestock' = :typeOfLivestock`,
    {
      replacements: { 
        applicationReference, 
        typeOfLivestock,
      },
      type: QueryTypes.SELECT,
      model: models.herd,
      mapToModel: true,
    }
  )
  return herds
}