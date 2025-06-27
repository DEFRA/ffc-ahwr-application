import { config } from '../../../../app/config'
import { processApplicationMessage } from '../../../../app/messaging/process-message'
import { processApplicationQueue } from '../../../../app/messaging/application/process-application'
import { setPaymentStatusToPaid } from '../../../../app/messaging/application/set-payment-status-to-paid'

jest.mock('../../../../app/messaging/application/process-application')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../app/messaging/application/set-payment-status-to-paid')

const { applicationRequestMsgType, moveClaimToPaidMsgType } = config

describe('Process Message test', () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const sbi = '123456789'
  const receiver = {
    completeMessage: jest.fn(),
    abandonMessage: jest.fn()
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

    await processApplicationMessage(message, receiver)
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

    await processApplicationMessage(message, receiver)
    expect(setPaymentStatusToPaid).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })
})
