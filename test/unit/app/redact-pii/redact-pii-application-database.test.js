import { redactPII as redactClaimPII } from '../../../../app/repositories/claim-repository.js'
import { redactPII as redactContactHistoryPII } from '../../../../app/repositories/contact-history-repository.js'
import { redactPII as redactFlagPII } from '../../../../app/repositories/flag-repository.js'
import { redactPII as redactHerdPII } from '../../../../app/repositories/herd-repository.js'
import { redactPII as redactApplicationPII } from '../../../../app/repositories/application-repository.js'
import { redactPII } from '../../../../app/redact-pii/redact-pii-application-database'
import { updateApplicationRedactRecords } from '../../../../app/redact-pii/update-application-redact-records'

jest.mock('../../../../app/repositories/claim-repository.js')
jest.mock('../../../../app/repositories/contact-history-repository.js')
jest.mock('../../../../app/repositories/flag-repository.js')
jest.mock('../../../../app/repositories/herd-repository.js')
jest.mock('../../../../app/repositories/application-repository.js')
jest.mock('../../../../app/redact-pii/update-application-redact-records.js')

describe('redact-pii-application-database', () => {
  let mockLogger

  beforeEach(() => {
    jest.clearAllMocks()

    mockLogger = {
      info: jest.fn(),
      setBindings: jest.fn()
    }

    redactClaimPII.mockResolvedValue()
    redactContactHistoryPII.mockResolvedValue()
    redactFlagPII.mockResolvedValue()
    redactHerdPII.mockResolvedValue()
    redactApplicationPII.mockResolvedValue()
    updateApplicationRedactRecords.mockResolvedValue()
  })

  it('should call all redact functions for each agreement and log success', async () => {
    const agreements = [
      { reference: 'AG-001', redactedSbi: '1048573892' },
      { reference: 'AG-002', redactedSbi: '1092541892' }
    ]

    await redactPII(agreements, 'progressId', mockLogger)

    expect(redactHerdPII).toHaveBeenCalledTimes(2)
    expect(redactFlagPII).toHaveBeenCalledTimes(2)
    expect(redactContactHistoryPII).toHaveBeenCalledTimes(2)
    expect(redactClaimPII).toHaveBeenCalledTimes(2)
    expect(redactApplicationPII).toHaveBeenCalledTimes(2)

    agreements.forEach(({ reference, redactedSbi }) => {
      expect(redactHerdPII).toHaveBeenCalledWith(reference)
      expect(redactFlagPII).toHaveBeenCalledWith(reference)
      expect(redactContactHistoryPII).toHaveBeenCalledWith(reference, redactedSbi, mockLogger)
      expect(redactClaimPII).toHaveBeenCalledWith(reference, mockLogger)
      expect(redactApplicationPII).toHaveBeenCalledWith(reference, redactedSbi, mockLogger)
    })

    expect(mockLogger.info).toHaveBeenCalledWith(
      `applicationDatabaseRedactPII with: ${JSON.stringify(agreements)}`
    )
  })

  it('should handle errors, call updateApplicationRedactRecords, and rethrow error', async () => {
    const agreements = [{ reference: 'AG-003', redactedSbi: '1092541892' }]
    const testError = new Error('Redaction failed')

    redactFlagPII.mockRejectedValueOnce(testError)

    await expect(redactPII(agreements, 'progressId', mockLogger))
      .rejects
      .toThrow('Redaction failed')

    expect(mockLogger.setBindings).toHaveBeenCalledWith({ err: testError })
    expect(updateApplicationRedactRecords).toHaveBeenCalledWith(
      agreements,
      true,
      'progressId',
      'N'
    )
  })
})
