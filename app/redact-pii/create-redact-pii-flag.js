import { raiseApplicationFlaggedEvent } from '../event-publisher/index.js'
import { createFlagForRedactPII } from '../repositories/flag-repository.js'
import { updateApplicationRedactRecords } from './update-application-redact-records.js'

export const create = async (applicationsToRedact, redactProgress, logger) => {
  try {
    await Promise.all(
      applicationsToRedact.map(async (application) => {
        const { reference: applicationReference, data: { sbi } } = application

        const result = await createFlagForRedactPII({
          applicationReference,
          sbi,
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
        }, sbi)
      })
    )
    logger.info(`addFlagForRedactPII with: ${JSON.stringify(applicationsToRedact)}`)
  } catch (err) {
    logger.setBindings({ err })
    await updateApplicationRedactRecords(applicationsToRedact, true, redactProgress, 'N')
    throw err
  }
}
