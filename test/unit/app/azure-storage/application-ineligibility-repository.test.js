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
  })
})
