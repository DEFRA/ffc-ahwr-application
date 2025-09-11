import { redactPII as redactStatusPII } from '../azure-storage/application-status-repository.js'
import { redactPII as redactIneligibilityPII } from '../azure-storage/application-ineligibility-repository.js'
import { redactPII as redactApplicationEventPII } from '../azure-storage/application-eventstore-repository.js'
import { updateApplicationRedactRecords } from './update-application-redact-records.js'

export const redactPII = async (agreementsToRedact, redactProgress, logger) => {
  try {
    logger.info(`applicationStorageAccountTablesRedactPII with: ${JSON.stringify(agreementsToRedact)}`)
    for (const { data } of agreementsToRedact) {
      const { sbi, claims, startDate, endDate } = data
      await redactApplicationEventPII(sbi, logger, startDate, endDate)
      await redactIneligibilityPII(sbi, logger, startDate, endDate)
      await Promise.all(
        claims.map(({ reference }) => redactStatusPII(reference, logger))
      )
    }
  } catch (err) {
    logger.setBindings({ err })
    await updateApplicationRedactRecords(agreementsToRedact, true, redactProgress, 'N')
    throw err
  }
}
