import { updateEntitiesByPartitionKey } from './update-entities.js'
import { odata } from '@azure/data-tables'
import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import { minusHours } from '../lib/date-utils.js'

const REDACT_HOURS_BEFORE = 6

export const redactPII = async (sbi, logger, startDate, endDate) => {
  const propertiesToMerge = {
    ChangedBy: REDACT_PII_VALUES.REDACTED_CHANGED_BY
  }

  let queryFilter = odata`PartitionKey eq '${sbi}'`

  if (startDate) {
    const eventStartDate = minusHours(startDate, REDACT_HOURS_BEFORE)
    queryFilter += ` and ChangedOn ge '${eventStartDate}'`
  }

  if (endDate) {
    const eventEndDate = minusHours(endDate, REDACT_HOURS_BEFORE)
    queryFilter += ` and ChangedOn lt '${eventEndDate}'`
  }

  await updateEntitiesByPartitionKey(
    'ffcahwrineligibility',
    sbi,
    queryFilter,
    propertiesToMerge,
    logger
  )
}
