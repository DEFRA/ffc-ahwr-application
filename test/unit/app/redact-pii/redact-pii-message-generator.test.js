import wreck from '@hapi/wreck'
import { config } from '../../../../app/config'
import { redactPII } from '../../../../app/redact-pii/redact-pii-message-generator'
import { updateApplicationRedactRecords } from '../../../../app/redact-pii/update-application-redact-records'

jest.mock('@hapi/wreck', () => ({
  post: jest.fn()
}))
jest.mock('../../../../app/redact-pii/update-application-redact-records.js', () => ({
  updateApplicationRedactRecords: jest.fn()
}))

describe('redact-pii-message-generator', () => {
  const endpoint = `${config.messageGeneratorApiUri}/redact/pii`
  let agreementsToRedact
  const redactProgress = ['applications-to-redact', 'message-generator']
  let logger

  beforeEach(() => {
    agreementsToRedact = [
      { reference: 'AHWR-123', data: { sbi: 'SBI001' } },
      { reference: 'AHWR-456', data: { sbi: 'SBI002' } }
    ]
    logger = { setBindings: jest.fn() }
    jest.clearAllMocks()
  })

  it('should successfully call message generator redact pii api with the correct payload', async () => {
    wreck.post.mockResolvedValueOnce({})

    await redactPII(agreementsToRedact, redactProgress, logger)

    expect(wreck.post).toHaveBeenCalledWith(endpoint, {
      json: true,
      payload: {
        agreementsToRedact: [
          { reference: 'AHWR-123' },
          { reference: 'AHWR-456' }
        ]
      }
    })
    expect(updateApplicationRedactRecords).not.toHaveBeenCalled()
    expect(logger.setBindings).not.toHaveBeenCalled()
  })

  it('should update application redact status to failed when api error occurs', async () => {
    const testError = new Error('API failure')
    wreck.post.mockRejectedValueOnce(testError)

    await expect(redactPII(agreementsToRedact, redactProgress, logger))
      .rejects
      .toThrow('API failure')

    expect(logger.setBindings).toHaveBeenCalledWith({
      err: testError,
      endpoint
    })
    expect(updateApplicationRedactRecords).toHaveBeenCalledWith(
      agreementsToRedact,
      true,
      redactProgress,
      'N'
    )
  })
})
