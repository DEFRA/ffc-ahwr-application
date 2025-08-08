import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import { getApplicationEvents, redactPII } from '../../../../app/azure-storage/application-eventstore-repository'
import { queryEntitiesByPartitionKey } from '../../../../app/azure-storage/query-entities'
import { updateEntitiesByPartitionKey } from '../../../../app/azure-storage/update-entities'

jest.mock('../../../../app/azure-storage/query-entities')
jest.mock('../../../../app/azure-storage/update-entities')

describe('Application Event Store Repository test', () => {
  const reference = 'ABC-1234'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getApplicationEvents ', () => {
    test('getApplicationEvents - application events found', async () => {
      queryEntitiesByPartitionKey.mockResolvedValue(
        [{ Payload: '{"type":"claim-createdAt","message":"Session set for claim and createdAt.","data":{"createdAt":"2023-04-18T14:17:28.623Z"},"raisedBy":"1105110083@email.com","raisedOn":"2023-06-30T12:41:00.123Z"}', EventType: 'claim-createdAt', EventRaised: '2023-06-30T12:41:00.123Z' },
          { Payload: '{"type":"claim-claimed","message":"Session set for claim and claimed.","data":{"claimed":false},"raisedBy":"1105110083@email.com","raisedOn":"2023-06-30T12:142:00.456Z"}', EventType: 'claim-claimed', EventRaised: '2023-06-30T12:142:00.456Z' }])

      const result = await getApplicationEvents(reference)

      expect(queryEntitiesByPartitionKey).toHaveBeenCalledTimes(1)
      expect(result.length).toBe(2)
    })

    test('getApplicationEvents - application events not found', async () => {
      queryEntitiesByPartitionKey.mockResolvedValue([])

      const result = await getApplicationEvents(reference)

      expect(queryEntitiesByPartitionKey).toHaveBeenCalledTimes(1)
      expect(result).toBeNull()
    })
  })

  describe('redactPII', () => {
    test('should call updateEntitiesByPartitionKey with the correct parameters', async () => {
      const mockLogger = jest.fn()

      await redactPII('123456789', mockLogger)

      expect(updateEntitiesByPartitionKey).toHaveBeenCalledTimes(1)
      expect(updateEntitiesByPartitionKey).toHaveBeenCalledWith(
        'ahwreventstore',
        '123456789',
        "PartitionKey eq '123456789'",
        {
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
            vetName: REDACT_PII_VALUES.REDACTED_VETS_NAME,
            vetRcvs: REDACT_PII_VALUES.REDACTED_VET_RCVS_NUMBER,
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
        },
        mockLogger
      )
    })
  })
})
