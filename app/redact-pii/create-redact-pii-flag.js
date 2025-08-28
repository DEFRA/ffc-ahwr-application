import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import { raiseApplicationFlaggedEvent } from '../event-publisher/index.js'
import { createFlagForRedactPII } from '../repositories/flag-repository.js'
import { updateApplicationRedactRecords } from './update-application-redact-records.js'
import pLimit from 'p-limit'

const CONCURRENCY = 20

export const create = async (applicationsToRedact, redactProgress, logger) => {
  try {
    const limit = pLimit(CONCURRENCY)

    await Promise.all(
      applicationsToRedact.map((application) =>
        limit(async () => {
          const { reference: applicationReference } = application

          const result = await createFlagForRedactPII({
            applicationReference,
            sbi: REDACT_PII_VALUES.REDACTED_SBI,
            note: 'Application PII redacted',
            createdBy: 'admin',
            appliesToMh: false
          })

          await raiseApplicationFlaggedEvent({
            application: { id: applicationReference },
            message: 'Application flagged',
            flag: { id: result.id, note: result.note, appliesToMh: result.appliesToMh },
            raisedBy: result.createdBy,
            raisedOn: result.createdAt
          }, result.sbi)
        })
      )
    )
    logger.info(`addFlagForRedactPII with: ${JSON.stringify(applicationsToRedact)}`)
  } catch (err) {
    logger.setBindings({ err })
    await updateApplicationRedactRecords(applicationsToRedact, true, redactProgress, 'N')
    throw err
  }
}
