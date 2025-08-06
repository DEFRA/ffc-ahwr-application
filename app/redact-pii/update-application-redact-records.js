import { updateApplicationRedact } from '../repositories/application-redact-repository.js'
import { buildData } from '../data/index.js'

const { sequelize } = buildData

export const updateApplicationRedactRecords = async (applicationsToRedact, incrementRetryCount, status, success) => {
  await sequelize.transaction(async () => {
    await Promise.all(applicationsToRedact.map((a) => {
      const retryCount = incrementRetryCount ? Number(a.retryCount) + 1 : a.retryCount
      return updateApplicationRedact(a.id, retryCount, status.join(), success)
    }))
  })
}
