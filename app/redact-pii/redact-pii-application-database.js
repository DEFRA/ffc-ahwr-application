import { redactPII as redactClaimPII } from '../repositories/claim-repository.js'
import { redactPII as redactContactHistoryPII } from '../repositories/contact-history-repository.js'
import { redactPII as redactFlagPII } from '../repositories/flag-repository.js'
import { redactPII as redactHerdPII } from '../repositories/herd-repository.js'
import { redactPII as redactApplicationPII } from '../repositories/application-repository.js'
import { updateApplicationRedactRecords } from './update-application-redact-records.js'

export const redactPII = async (agreementsToRedact, redactProgress, logger) => {
  try {
    await Promise.all(
      agreementsToRedact.map(async (agreement) => {
        await redactHerdPII(agreement.reference)
        await redactFlagPII(agreement.reference)
        await redactContactHistoryPII(agreement.reference, logger)
        await redactClaimPII(agreement.reference)
        await redactApplicationPII(agreement.reference, logger)
      })
    )
    logger.info(`applicationDatabaseRedactPII with: ${JSON.stringify(agreementsToRedact)}`)
  } catch (err) {
    logger.setBindings({ err })
    await updateApplicationRedactRecords(agreementsToRedact, true, redactProgress, 'N')
    throw err
  }
}
