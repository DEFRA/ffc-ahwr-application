import appInsights from 'applicationinsights'
import { validateRedactPIISchema } from '../../../../app/messaging/schema/process-redact-pii-schema'

jest.mock('applicationinsights', () => ({
  defaultClient: {
    trackException: jest.fn()
  }
}))

describe('validateRedactPIISchema', () => {
  let logger

  beforeEach(() => {
    logger = { error: jest.fn() }
    jest.clearAllMocks()
  })

  it('returns true for a valid ISO date string', () => {
    const event = { requestedDate: '2025-08-14T12:34:56Z' }

    const result = validateRedactPIISchema(event, logger)

    expect(result).toBe(true)
    expect(logger.error).not.toHaveBeenCalled()
    expect(appInsights.defaultClient.trackException).not.toHaveBeenCalled()
  })

  it('returns false and logs error for an invalid date', () => {
    const event = { requestedDate: 'not-a-date' }

    const result = validateRedactPIISchema(event, logger)

    expect(result).toBe(false)
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Redact PII validation error')
    )
    expect(appInsights.defaultClient.trackException).toHaveBeenCalledWith({
      exception: expect.any(Error)
    })
  })

  it('returns false if requestedDate is missing', () => {
    const event = {}

    const result = validateRedactPIISchema(event, logger)

    expect(result).toBe(false)
    expect(logger.error).toHaveBeenCalled()
    expect(appInsights.defaultClient.trackException).toHaveBeenCalled()
  })
})
