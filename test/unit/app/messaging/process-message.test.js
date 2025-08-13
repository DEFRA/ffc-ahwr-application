import { config } from '../../../../app/config'
import { processApplicationMessage } from '../../../../app/messaging/process-message'
import { processApplicationQueue } from '../../../../app/messaging/application/process-application'
import { setPaymentStatusToPaid } from '../../../../app/messaging/application/set-payment-status-to-paid'
import { processRedactPiiRequest } from '../../../../app/messaging/application/process-redact-pii'

jest.mock('../../../../app/messaging/application/process-application')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../app/messaging/application/set-payment-status-to-paid')
jest.mock('../../../../app/messaging/application/process-redact-pii')

const { applicationRequestMsgType, moveClaimToPaidMsgType, redactPiiRequestMsgType } = config

describe('Process Message test', () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const sbi = '123456789'
  const receiver = {
    completeMessage: jest.fn(),
    abandonMessage: jest.fn()
  }
  const mockLogger = {
    warn: jest.fn()
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test(`${applicationRequestMsgType} message calls processApplication`, async () => {
    const message = {
      messageId: '1234567890',
      body: {
        cattle: 'yes',
        pigs: 'yes',
        organisation: {
          sbi,
          name: 'test-org',
          email: 'test-email'
        }
      },
      applicationProperties: {
        type: applicationRequestMsgType
      },
      sessionId
    }

    await processApplicationMessage(message, receiver, mockLogger)
    expect(processApplicationQueue).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })

  test(`${moveClaimToPaidMsgType} message calls setPaymentStatusToPaid`, async () => {
    const message = {
      messageId: '1234567890',
      body: {
        claimRef: 'FUBC-1234-5678',
        sbi: '123456789'
      },
      applicationProperties: {
        type: moveClaimToPaidMsgType
      },
      sessionId
    }

    await processApplicationMessage(message, receiver, mockLogger)
    expect(setPaymentStatusToPaid).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })

  test(`${redactPiiRequestMsgType} message calls processRedactPiiRequest`, async () => {
    const message = {
      messageId: '1234567890',
      body: {
        requestDate: new Date()
      },
      applicationProperties: {
        type: redactPiiRequestMsgType
      },
      sessionId
    }

    await processApplicationMessage(message, receiver, mockLogger)
    expect(processRedactPiiRequest).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })

  test('unknown message calls nothing', async () => {
    const message = {
      messageId: '1234567890',
      body: {
        requestDate: new Date()
      },
      applicationProperties: {
        type: 'unknown'
      },
      sessionId
    }

    await processApplicationMessage(message, receiver, mockLogger)
    expect(mockLogger.warn).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })
})
