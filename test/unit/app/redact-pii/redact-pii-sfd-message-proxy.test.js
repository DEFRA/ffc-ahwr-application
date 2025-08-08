import wreck from '@hapi/wreck'
import { config } from '../../../../app/config'
import { updateApplicationRedactRecords } from '../../../../app/redact-pii/update-application-redact-records'
import { redactPII } from '../../../../app/redact-pii/redact-pii-sfd-messaging-proxy'

jest.mock('@hapi/wreck')
jest.mock('../../../../app/redact-pii/update-application-redact-records')

describe('callSfdMessagingProxyRedactPII', () => {
  const mockLogger = {
    setBindings: jest.fn()
  }

  const agreementsToRedact = [
    { reference: 'AHWR-123' },
    { reference: 'AHWR-456' }
  ]
  const redactProgress = ['applications-to-redact', 'documents']
  const endpoint = `${config.sfdMessagingProxyApiUri}/redact/pii`

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully call sfd message proxy redact pii api with the correct payload', async () => {
    wreck.post.mockResolvedValueOnce({})

    await redactPII(agreementsToRedact, redactProgress, mockLogger)

    expect(wreck.post).toHaveBeenCalledWith(endpoint, {
      json: true,
      payload: {
        agreementsToRedact: [{ reference: 'AHWR-123' }, { reference: 'AHWR-456' }]
      }
    })

    expect(updateApplicationRedactRecords).not.toHaveBeenCalled()
    expect(mockLogger.setBindings).not.toHaveBeenCalled()
  })

  it('should update application redact status to failed when api error occurs', async () => {
    const mockError = new Error('API failure')
    wreck.post.mockRejectedValueOnce(mockError)

    await expect(
      redactPII(agreementsToRedact, redactProgress, mockLogger)
    ).rejects.toThrow('API failure')

    expect(mockLogger.setBindings).toHaveBeenCalledWith({ err: mockError, endpoint })
    expect(updateApplicationRedactRecords).toHaveBeenCalledWith(
      agreementsToRedact,
      true,
      redactProgress,
      'N'
    )
  })
})
