import { buildData } from '../data/index.js'

const { models } = buildData

export const getAndIncrementComplianceCheckCount = async () => {
  const complianceCheckCount = await models.complianceCheckCount.findOne({
    where: { id: 1 }
  })

  if (!complianceCheckCount) {
    throw new Error('Compliance check count not found')
  }

  const updatedCount = await complianceCheckCount.increment('count')
  return Number(updatedCount.dataValues.count)
}