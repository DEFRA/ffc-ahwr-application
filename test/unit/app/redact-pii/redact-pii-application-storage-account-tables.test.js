import { redactPII as redactStatusPII } from '../../../../app/azure-storage/application-status-repository.js'
import { redactPII as redactIneligibilityPII } from '../../../../app/azure-storage/application-ineligibility-repository.js'
import { redactPII as redactApplicationEventPII } from '../../../../app/azure-storage/application-eventstore-repository.js'
import { updateApplicationRedactRecords } from '../../../../app/redact-pii/update-application-redact-records.js'
import { redactPII } from '../../../../app/redact-pii/redact-pii-application-storage-account-tables.js'

jest.mock('../../../../app/azure-storage/application-status-repository.js')
jest.mock('../../../../app/azure-storage/application-ineligibility-repository.js')
jest.mock('../../../../app/azure-storage/application-eventstore-repository.js')
jest.mock('../../../../app/redact-pii/update-application-redact-records.js')

describe('redactPII', () => {
  let mockLogger
  let agreementsToRedact

  beforeEach(() => {
    jest.clearAllMocks()
    mockLogger = {
      info: jest.fn(),
      setBindings: jest.fn()
    }

    agreementsToRedact = [
      {
        redactedSbi: '4371549251',
        data: {
          sbi: 'SBI123',
          claims: [
            { reference: 'CLAIM-1' },
            { reference: 'CLAIM-2' }
          ],
          startDate: '2024-04-05T00:00:00.000Z',
          endDate: '2024-08-05T00:00:00.000Z'
        }
      },
      {
        redactedSbi: '5821549261',
        data: {
          sbi: 'SBI456',
          claims: [
            { reference: 'CLAIM-3' }
          ],
          startDate: '2025-04-05T00:00:00.000Z',
          endDate: '2025-08-05T00:00:00.000Z'
        }
      }
    ]
  })

  it('should redact PII for all agreements and claims successfully', async () => {
    await redactPII(agreementsToRedact, ['applications-to-redact', 'documents'], mockLogger)

    expect(redactApplicationEventPII).toHaveBeenCalledTimes(2)
    expect(redactApplicationEventPII).toHaveBeenCalledWith('SBI123', '4371549251', mockLogger, '2024-04-05T00:00:00.000Z', '2024-08-05T00:00:00.000Z')
    expect(redactApplicationEventPII).toHaveBeenCalledWith('SBI456', '5821549261', mockLogger, '2025-04-05T00:00:00.000Z', '2025-08-05T00:00:00.000Z')

    expect(redactIneligibilityPII).toHaveBeenCalledTimes(2)
    expect(redactIneligibilityPII).toHaveBeenCalledWith('SBI123', '4371549251', mockLogger, '2024-04-05T00:00:00.000Z', '2024-08-05T00:00:00.000Z')
    expect(redactIneligibilityPII).toHaveBeenCalledWith('SBI456', '5821549261', mockLogger, '2025-04-05T00:00:00.000Z', '2025-08-05T00:00:00.000Z')

    expect(redactStatusPII).toHaveBeenCalledTimes(3)
    expect(redactStatusPII).toHaveBeenCalledWith('CLAIM-1', mockLogger)
    expect(redactStatusPII).toHaveBeenCalledWith('CLAIM-2', mockLogger)
    expect(redactStatusPII).toHaveBeenCalledWith('CLAIM-3', mockLogger)

    expect(updateApplicationRedactRecords).not.toHaveBeenCalled()
  })

  it('should handle errors, call updateApplicationRedactRecords, and rethrow error', async () => {
    const testError = new Error('Redaction failed')
    redactApplicationEventPII.mockRejectedValueOnce(testError)

    await expect(redactPII(agreementsToRedact, ['applications-to-redact', 'documents'], mockLogger))
      .rejects.toThrow('Redaction failed')

    expect(mockLogger.setBindings).toHaveBeenCalledWith({ err: testError })

    expect(updateApplicationRedactRecords).toHaveBeenCalledWith(
      agreementsToRedact,
      true,
      ['applications-to-redact', 'documents'],
      'N'
    )
  })
})
