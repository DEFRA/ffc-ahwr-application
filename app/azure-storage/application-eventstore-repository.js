import { queryEntitiesByPartitionKey } from './query-entities.js'
import { odata } from '@azure/data-tables'
import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import { updateEntitiesByPartitionKey } from './update-entities.js'

export const getApplicationEvents = async (sbi) => {
  const eventRecords = await queryEntitiesByPartitionKey(
    'ahwreventstore',
    sbi,
    // The partition key in the eventstore table can be either sbi or sbi_cph
    // so query where the partition key starts with the sbi
    odata`PartitionKey ge ${sbi} and PartitionKey lt ${(+sbi + 1).toString()}`
  )

  if (eventRecords.length === 0) { return null }
  return eventRecords
}

export const redactPII = async (sbi) => {
  const propertiesToMerge = {
    ChangedBy: REDACT_PII_VALUES.REDACTED_CHANGED_BY,
    Payload: {
      cph: REDACT_PII_VALUES.CPH,
      exception: REDACT_PII_VALUES.REDACTED_EXCEPTION,
      farmerName: REDACT_PII_VALUES.REDACTED_FARMER_NAME,
      organisationName: REDACT_PII_VALUES.REDACTED_ORGANISATION_NAME,
      orgEmail: REDACT_PII_VALUES.REDACTED_ORG_EMAIL,
      email: REDACT_PII_VALUES.REDACTED_EMAIL,
      name: REDACT_PII_VALUES.REDACTED_NAME,
      address: REDACT_PII_VALUES.REDACTED_ADDRESS,
      vetName: REDACT_PII_VALUES.REDACTED_VETS_NAME, // OLD FIELD
      vetRcvs: REDACT_PII_VALUES.REDACTED_VET_RCVS_NUMBER, // OLD FIELD
      vetsName: REDACT_PII_VALUES.REDACTED_VETS_NAME,
      vetRcvsNumber: REDACT_PII_VALUES.REDACTED_VET_RCVS_NUMBER,
      urnResult: REDACT_PII_VALUES.REDACTED_URN_RESULT,
      latestEndemicsApplication: REDACT_PII_VALUES.REDACTED_LATEST_ENDEMICS_APPLICATION,
      latestVetVisitApplication: REDACT_PII_VALUES.REDACTED_LATEST_VET_VISIT_APPLICATION,
      relevantReviewForEndemics: REDACT_PII_VALUES.REDACTED_RELEVANT_REVIEW_FOR_ENDEMICS,
      previousClaims: REDACT_PII_VALUES.REDACTED_PREVIOUS_CLAIMS,
      herdName: REDACT_PII_VALUES.REDACTED_HERD_NAME,
      herdCph: REDACT_PII_VALUES.REDACTED_CPH,
      herds: REDACT_PII_VALUES.REDACTED_HERDS,
      flagDetail: REDACT_PII_VALUES.REDACTED_FLAG_DETAIL,
      deletedNote: REDACT_PII_VALUES.REDACTED_DELETED_NOTE,
      note: REDACT_PII_VALUES.REDACTED_NOTE,
      invalidClaimData: REDACT_PII_VALUES.REDACTED_INVALID_CLAIM_DATA,
      raisedBy: REDACT_PII_VALUES.REDACTED_RAISED_BY,
      message: REDACT_PII_VALUES.REDACTED_MESSAGE
    }
  }

  await updateEntitiesByPartitionKey(
    'ahwreventstore',
    sbi,
    odata`PartitionKey eq '${sbi}'`,
    propertiesToMerge
  )
}
