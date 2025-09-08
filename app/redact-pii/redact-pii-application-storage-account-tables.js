import { redactPII as redactStatusPII } from '../azure-storage/application-status-repository.js'
import { redactPII as redactIneligibilityPII } from '../azure-storage/application-ineligibility-repository.js'
import { redactPII as redactApplicationEventPII } from '../azure-storage/application-eventstore-repository.js'
import { updateApplicationRedactRecords } from './update-application-redact-records.js'

export const redactPII = async (agreementsToRedact, redactProgress, logger) => {
  try {
    logger.info(`applicationStorageAccountTablesRedactPII with: ${JSON.stringify(agreementsToRedact)}`)
    for (const { data, redactedSbi } of agreementsToRedact) {
      const { sbi, claims, startDate, endDate } = data
      await redactApplicationEventPII(sbi, redactedSbi, logger, startDate, endDate)
      await redactIneligibilityPII(sbi, redactedSbi, logger, startDate, endDate)
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
