import wreck from '@hapi/wreck'
import HttpStatus from 'http-status-codes'
import { processRedactPiiRequest } from '../../../../../app/messaging/application/process-redact-pii'
import { getApplicationsToRedactFor } from '../../../../../app/repositories/application-redact-repository'
import { getAgreementsToRedactWithNoPaymentOlderThanThreeYears, getAgreementsToRedactWithRejectedPaymentOlderThanThreeYears, getAgreementsToRedactWithPaymentOlderThanSevenYears, redactPII as redactApplicationPII } from '../../../../../app/repositories/application-repository'

jest.mock('../../../../../app/repositories/application-redact-repository')
jest.mock('../../../../../app/repositories/application-repository')
jest.mock('@hapi/wreck')
jest.mock('../../../../../app/config/index', () => ({
  config: {
    documentGeneratorApiUri: 'http://doc-gen/api',
    sfdMessagingProxyApiUri: 'http://sfd-proxy/api'
  }
}))

const createLogger = () => ({ error: jest.fn(), info: jest.fn(), setBindings: jest.fn() })

describe('processRedactPiiRequest', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should complete successfully', async () => {
    const requestedDate = new Date()
    const message = { body: { requestDate: requestedDate } }

    const mockLogger = createLogger()

    await processRedactPiiRequest(message, mockLogger)

    expect(wreck.post).toHaveBeenCalledTimes(2)
    expect(wreck.post).toHaveBeenCalledWith('http://doc-gen/api/redact/pii', { json: true, payload: expect.any(Object) })
    expect(wreck.post).toHaveBeenCalledWith('http://sfd-proxy/api/redact/pii', { json: true, payload: expect.any(Object) })
    expect(mockLogger.info).toHaveBeenCalledWith('Successfully processed redact PII request')
  })

  it('should stop processing if fails comms with document generator', async () => {
    const requestedDate = new Date()
    const message = { body: { requestDate: requestedDate } }

    const mockLogger = createLogger()
    wreck.post = jest.fn().mockRejectedValueOnce('fake-docgen-comms-error')

    await expect(processRedactPiiRequest(message, mockLogger)).rejects.toBe('fake-docgen-comms-error')

    expect(wreck.post).toHaveBeenCalledTimes(1)
    expect(wreck.post).toHaveBeenCalledWith('http://doc-gen/api/redact/pii', { json: true, payload: expect.any(Object) })
    expect(mockLogger.info).not.toHaveBeenCalledWith('Successfully processed redact PII request')
  })

  it.only('should stop processing if fails comms with sfd messaging proxy', async () => {
    const requestedDate = new Date()
    const message = { body: { requestedDate } }

    const wreckResponse = {
      payload: {},
      res: {
        statusCode: HttpStatus.OK
      },
      json: true
    }
    const mockLogger = createLogger()
    wreck.post = jest.fn()
      .mockResolvedValueOnce(wreckResponse)
      .mockRejectedValueOnce('fake-sfd-comms-error')
    
    getApplicationsToRedactFor.mockResolvedValueOnce([{
      reference: 'AHWR-1'
    }])

    await expect(processRedactPiiRequest(message, mockLogger)).rejects.toBe('fake-sfd-comms-error')
    
    expect(wreck.post).toHaveBeenCalledTimes(2)
    expect(wreck.post).toHaveBeenCalledWith('http://doc-gen/api/redact/pii', { json: true, payload: expect.any(Object) })
    expect(wreck.post).toHaveBeenCalledWith('http://sfd-proxy/api/redact/pii', { json: true, payload: expect.any(Object) })
    expect(mockLogger.info).not.toHaveBeenCalledWith('Successfully processed redact PII request')
  })
})
