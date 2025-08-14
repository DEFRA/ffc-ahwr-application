import { redactPII as redactDocumentGeneratorPII } from '../../../../../app/redact-pii/redact-pii-document-generator.js'
import { redactPII as redactSFDMessagingProxyPII } from '../../../../../app/redact-pii/redact-pii-sfd-messaging-proxy.js'
import { redactPII as redactApplicationStorageAccountTablesPII } from '../../../../../app/redact-pii/redact-pii-application-storage-account-tables.js'
import { redactPII as redactApplicationDatabasePII } from '../../../../../app/redact-pii/redact-pii-application-database.js'
import { updateApplicationRedactRecords } from '../../../../../app/redact-pii/update-application-redact-records.js'
import { create as createRedactPIIFlag } from '../../../../../app/redact-pii/create-redact-pii-flag.js'
import { getApplicationsToRedact } from '../../../../../app/redact-pii/get-applications-to-redact.js'
import { processRedactPiiRequest } from '../../../../../app/messaging/application/process-redact-pii.js'
import { validateRedactPIISchema } from '../../../../../app/messaging/schema/process-redact-pii-schema.js'

jest.mock('../../../../../app/redact-pii/redact-pii-document-generator.js')
jest.mock('../../../../../app/redact-pii/redact-pii-sfd-messaging-proxy.js')
jest.mock('../../../../../app/redact-pii/redact-pii-application-storage-account-tables.js')
jest.mock('../../../../../app/redact-pii/redact-pii-application-database.js')
jest.mock('../../../../../app/redact-pii/update-application-redact-records.js')
jest.mock('../../../../../app/redact-pii/create-redact-pii-flag.js')
jest.mock('../../../../../app/redact-pii/get-applications-to-redact.js')
jest.mock('../../../../../app/messaging/schema/process-redact-pii-schema.js')

describe('processRedactPiiRequest', () => {
  const mockLogger = {
    setBindings: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
  const message = {
    body: {
      requestedDate: '2025-08-05T00:00:00.000Z'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    validateRedactPIISchema.mockReturnValue(true)
  })

  it('should log and exit when there are no applications to redact', async () => {
    getApplicationsToRedact.mockResolvedValueOnce({ applicationsToRedact: [], status: [] })

    await processRedactPiiRequest(message, mockLogger)

    expect(mockLogger.info).toHaveBeenCalledWith('No new applications to redact for this date')
    expect(redactDocumentGeneratorPII).not.toHaveBeenCalled()
    expect(updateApplicationRedactRecords).not.toHaveBeenCalled()
  })

  it('should call all redact functions and update records when no previous failed attempts', async () => {
    const apps = [{ id: 1 }]
    getApplicationsToRedact.mockResolvedValueOnce({ applicationsToRedact: apps, status: ['applications-to-redact'] })

    await processRedactPiiRequest(message, mockLogger)

    expect(redactDocumentGeneratorPII).toHaveBeenCalledWith(apps, ['applications-to-redact'], mockLogger)
    expect(redactSFDMessagingProxyPII).toHaveBeenCalledWith(apps, ['applications-to-redact', 'documents'], mockLogger)
    expect(redactApplicationStorageAccountTablesPII).toHaveBeenCalledWith(apps, ['applications-to-redact', 'documents', 'messages'], mockLogger)
    expect(redactApplicationDatabasePII).toHaveBeenCalledWith(apps, ['applications-to-redact', 'documents', 'messages', 'storage-accounts'], mockLogger)
    expect(createRedactPIIFlag).toHaveBeenCalledWith(apps, ['applications-to-redact', 'documents', 'messages', 'storage-accounts', 'database-tables'], mockLogger)

    expect(updateApplicationRedactRecords).toHaveBeenCalledWith(apps, false, ['applications-to-redact', 'documents', 'messages', 'storage-accounts', 'database-tables', 'redacted-flag'], 'Y')
    expect(mockLogger.info).toHaveBeenCalledWith('Successfully processed redact PII request')
  })

  it('should skip steps already in status', async () => {
    const apps = [{ id: 2 }]
    const status = ['applications-to-redact', 'documents', 'messages', 'storage-accounts', 'database-tables']
    getApplicationsToRedact.mockResolvedValue({ applicationsToRedact: apps, status })

    await processRedactPiiRequest(message, mockLogger)

    expect(redactDocumentGeneratorPII).not.toHaveBeenCalled()
    expect(redactSFDMessagingProxyPII).not.toHaveBeenCalled()
    expect(redactApplicationStorageAccountTablesPII).not.toHaveBeenCalled()
    expect(redactApplicationDatabasePII).not.toHaveBeenCalled()
    expect(createRedactPIIFlag).toHaveBeenCalled()
    expect(updateApplicationRedactRecords).toHaveBeenCalledWith(apps, false, ['applications-to-redact', 'documents', 'messages', 'storage-accounts', 'database-tables', 'redacted-flag'], 'Y')
  })

  it('should throw error when message validation fails', async () => {
    validateRedactPIISchema.mockReturnValue(false)
    await expect(processRedactPiiRequest({ body: { requestedDate: 'invalid' } }, mockLogger)).rejects.toThrow('Redact PII validation error')
  })
})
