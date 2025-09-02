import { replaceEntitiesByPartitionKey } from './update-entities.js'
import { odata } from '@azure/data-tables'
import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'

export const redactPII = async (sbi, redactedSbi, logger) => {
  const propertiesToMerge = {
    ChangedBy: REDACT_PII_VALUES.REDACTED_CHANGED_BY,
    Payload: {
      sbi: redactedSbi
    }
  }

  await replaceEntitiesByPartitionKey(
    'ffcahwrineligibility',
    sbi,
    odata`PartitionKey eq '${sbi}'`,
    propertiesToMerge,
    redactedSbi,
    logger
  )
}
