import { updateEntitiesByPartitionKey } from './update-entities.js'
import { odata } from '@azure/data-tables'
import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'

export const redactPII = async (sbi, logger) => {
  const propertiesToMerge = { ChangedBy: REDACT_PII_VALUES.REDACTED_CHANGED_BY }

  await updateEntitiesByPartitionKey(
    'ffcahwrineligibility',
    sbi,
    odata`PartitionKey eq '${sbi}'`,
    propertiesToMerge,
    logger
  )
}
