import { buildData } from '../data/index.js'

const { models } = buildData

export async function getAll () {
  return models.stage_execution.findAll()
}

export async function getById (id) {
  return models.stage_execution.findOne(
    {
      where: { id }
    })
}

export async function getByApplicationReference (applicationReference) {
  return models.stage_execution.findAll(
    {
      where: { applicationReference }
    })
}

export async function set (data) {
  return models.stage_execution.create(data)
}

export async function update (data) {
  return models.stage_execution.update(
    { processedAt: new Date() },
    {
      where: { id: data.id },
      returning: true
    }
  )
}
