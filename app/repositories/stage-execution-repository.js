import { buildData } from '../data/index.js'

const { models } = buildData

export async function getAll () {
  return await models.stage_execution.findAll()
}

export async function getById (id) {
  return await models.stage_execution.findOne(
    {
      where: { id }
    })
}

export async function getByApplicationReference (applicationReference) {
  return await models.stage_execution.findAll(
    {
      where: { applicationReference }
    })
}

export async function set (data) {
  const result = await models.stage_execution.create(data)
  return result
}

export async function update (data) {
  const result = await models.stage_execution.update(
    { processedAt: new Date() },
    {
      where: { id: data.id },
      returning: true
    }
  )
  return result
}
