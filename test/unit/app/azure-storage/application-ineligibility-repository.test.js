import { REDACT_PII_VALUES } from 'ffc-ahwr-common-library'
import { redactPII } from '../../../../app/azure-storage/application-ineligibility-repository'
import { replaceEntitiesByPartitionKey } from '../../../../app/azure-storage/update-entities'

jest.mock('../../../../app/azure-storage/update-entities')

describe('Application Ineligibility Repository test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('redactPII', () => {
    test('should call replaceEntitiesByPartitionKey with the correct parameters', async () => {
      const mockLogger = jest.fn()

      await redactPII('123456789', '987654321', mockLogger)

      expect(replaceEntitiesByPartitionKey).toHaveBeenCalledTimes(1)
      expect(replaceEntitiesByPartitionKey).toHaveBeenCalledWith(
        'ffcahwrineligibility',
        '123456789',
        "PartitionKey eq '123456789'",
        {
          ChangedBy: REDACT_PII_VALUES.REDACTED_CHANGED_BY,
          Payload: {
            sbi: '987654321'
          }
        },
        '987654321',
        mockLogger
      )
    })

    test('should call replaceEntitiesByPartitionKey with the correct parameters when given startDate and endDate', async () => {
      const mockLogger = jest.fn()
      const startDate = '2025-03-05T03:18:00.000Z'
      const endDate = '2025-09-18T18:34:00.000Z'

      await redactPII('123456789', '987654321', mockLogger, startDate, endDate)

      expect(replaceEntitiesByPartitionKey).toHaveBeenCalledTimes(1)
      expect(replaceEntitiesByPartitionKey).toHaveBeenCalledWith(
        'ffcahwrineligibility',
        '123456789',
        "PartitionKey eq '123456789' and ChangedOn ge '2025-03-04T21:18:00.000Z' and ChangedOn lt '2025-09-18T12:34:00.000Z'",
        {
          ChangedBy: REDACT_PII_VALUES.REDACTED_CHANGED_BY,
          Payload: {
            sbi: '987654321'
          }
        },
        '987654321',
        mockLogger
      )
    })
  })
})
