import { updateApplicationRedactRecords } from '../../../../app/redact-pii/update-application-redact-records'
import { updateApplicationRedact } from '../../../../app/repositories/application-redact-repository'

jest.mock('../../../../app/repositories/application-redact-repository')

describe('update-application-redact-records redactPII', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call updateApplicationRedact for each agreement without incrementing retry count', async () => {
    const agreements = [
      { id: 1, retryCount: 0 },
      { id: 2, retryCount: 5 }
    ]
    const status = ['applications-to-redact', 'documents']
    const success = true

    await updateApplicationRedactRecords(agreements, false, status, success)

    expect(updateApplicationRedact).toHaveBeenCalledTimes(2)
    expect(updateApplicationRedact).toHaveBeenCalledWith(1, 0, 'applications-to-redact,documents', true)
    expect(updateApplicationRedact).toHaveBeenCalledWith(2, 5, 'applications-to-redact,documents', true)
  })

  it('should increment retryCount when incrementRetryCount is true', async () => {
    const agreements = [
      { id: 1, retryCount: 0 },
      { id: 2, retryCount: 5 }
    ]
    const status = ['applications-to-redact', 'documents']
    const success = false

    await updateApplicationRedactRecords(agreements, true, status, success)

    expect(updateApplicationRedact).toHaveBeenCalledTimes(2)
    expect(updateApplicationRedact).toHaveBeenCalledWith(1, 1, 'applications-to-redact,documents', false)
    expect(updateApplicationRedact).toHaveBeenCalledWith(2, 6, 'applications-to-redact,documents', false)
  })

  it('should return when no applications to redact', async () => {
    await updateApplicationRedactRecords([], true, 'applications-to-redact,documents', true)

    expect(updateApplicationRedact).not.toHaveBeenCalled()
  })
})
