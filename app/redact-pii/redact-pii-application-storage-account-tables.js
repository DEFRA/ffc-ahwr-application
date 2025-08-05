import { redactPII as redactStatusPII } from '../azure-storage/application-status-repository.js'
import { redactPII as redactIneligibilityPII } from '../azure-storage/application-ineligibility-repository.js'
import { redactPII as redactApplicationEventPII } from '../azure-storage/application-eventstore-repository.js'
import { updateApplicationRedactRecords } from './update-application-redact-records.js'

export const redactPII = async (agreementsToRedact, redactProgress, logger) => {
  try {
    logger.info(`applicatioStorageAccountTablesRedactPII with: ${JSON.stringify(agreementsToRedact)}`)
    await Promise.all(
      agreementsToRedact.map(async ({ data }) => {
        const { sbi, claims } = data
        await redactApplicationEventPII(sbi)
        await redactIneligibilityPII(sbi)
        await Promise.all(
          claims.map(({ reference }) => redactStatusPII(reference))
        )
      })
    )
  } catch (err) {
    logger.setBindings({ err })
    await updateApplicationRedactRecords(agreementsToRedact, true, redactProgress, 'N')
    throw err
  }
}
