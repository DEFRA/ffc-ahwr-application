import { raiseApplicationFlaggedEvent } from '../../../../app/event-publisher'
import { create } from '../../../../app/redact-pii/create-redact-pii-flag'
import { updateApplicationRedactRecords } from '../../../../app/redact-pii/update-application-redact-records'
import { createFlagForRedactPII } from '../../../../app/repositories/flag-repository'

jest.mock('../../../../app/event-publisher')
jest.mock('../../../../app/repositories/flag-repository')
jest.mock('../../../../app/redact-pii/update-application-redact-records')

describe('create', () => {
  let mockLogger

  beforeEach(() => {
    jest.clearAllMocks()

    mockLogger = {
      info: jest.fn(),
      setBindings: jest.fn()
    }
  })

  const agreementsToRedact = [
    {
      reference: 'AHWR-123',
      data: { sbi: '1058347297' }
    },
    {
      reference: 'AHWR-456',
      data: { sbi: '1035925297' }
    }
  ]

  it('should create flags and raise events for each agreement', async () => {
    createFlagForRedactPII.mockResolvedValueOnce({
      id: 'FLAG-1',
      note: 'Application PII redacted',
      appliesToMh: false,
      createdBy: 'admin',
      createdAt: '2025-08-05T12:00:00Z'
    })
    createFlagForRedactPII.mockResolvedValueOnce({
      id: 'FLAG-2',
      note: 'Application PII redacted',
      appliesToMh: false,
      createdBy: 'admin',
      createdAt: '2025-08-05T12:00:01Z'
    })
    raiseApplicationFlaggedEvent.mockResolvedValue()

    await create(agreementsToRedact, ['applications-to-redact', 'documents', 'messages', 'storage-accounts', 'database-tables'], mockLogger)

    expect(createFlagForRedactPII).toHaveBeenCalledTimes(2)
    expect(createFlagForRedactPII).toHaveBeenCalledWith({
      applicationReference: 'AHWR-123',
      sbi: '1058347297',
      note: 'Application PII redacted',
      createdBy: 'admin',
      appliesToMh: false
    })
    expect(createFlagForRedactPII).toHaveBeenCalledWith({
      applicationReference: 'AHWR-456',
      sbi: '1035925297',
      note: 'Application PII redacted',
      createdBy: 'admin',
      appliesToMh: false
    })

    expect(raiseApplicationFlaggedEvent).toHaveBeenCalledTimes(2)
    expect(raiseApplicationFlaggedEvent).toHaveBeenCalledWith({
      application: { id: 'AHWR-123' },
      message: 'Application flagged',
      flag: { id: 'FLAG-1', note: 'Application PII redacted', appliesToMh: false },
      raisedBy: 'admin',
      raisedOn: '2025-08-05T12:00:00Z'
    }, '1058347297')
    expect(raiseApplicationFlaggedEvent).toHaveBeenCalledWith({
      application: { id: 'AHWR-456' },
      message: 'Application flagged',
      flag: { id: 'FLAG-2', note: 'Application PII redacted', appliesToMh: false },
      raisedBy: 'admin',
      raisedOn: '2025-08-05T12:00:01Z'
    }, '1035925297')

    expect(mockLogger.info).toHaveBeenCalledWith(
      `addFlagForRedactPII with: ${JSON.stringify(agreementsToRedact)}`
    )
  })

  it('should handle errors, update redact records, and rethrow error', async () => {
    const createFlagError = new Error('Failed to create flag')
    createFlagForRedactPII.mockRejectedValue(createFlagError)

    await expect(create(agreementsToRedact, ['applications-to-redact', 'documents', 'messages', 'storage-accounts', 'database-tables'], mockLogger))
      .rejects.toThrow('Failed to create flag')

    expect(updateApplicationRedactRecords).toHaveBeenCalledWith(
      agreementsToRedact,
      true,
      ['applications-to-redact', 'documents', 'messages', 'storage-accounts', 'database-tables'],
      'N'
    )
    expect(mockLogger.setBindings).toHaveBeenCalledWith({ err: createFlagError })
  })
})
