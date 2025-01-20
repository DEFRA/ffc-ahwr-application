import { config } from '../../../../app/config'
import { fetchApplication } from '../../../../app/messaging/application/fetch-application'
import { fetchClaim } from '../../../../app/messaging/application/fetch-claim'
import { processApplicationMessage } from '../../../../app/messaging/process-message'
import { processApplicationQueue } from '../../../../app/messaging/application/process-application'

jest.mock('../../../../app/messaging/application/process-application')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
jest.mock('../../../../app/messaging/application/fetch-application')
jest.mock('../../../../app/messaging/application/fetch-claim')
jest.mock('../../../../app/messaging/application/process-application')

const { applicationRequestMsgType, fetchApplicationRequestMsgType, fetchClaimRequestMsgType } = config

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

  test(`${fetchApplicationRequestMsgType} message calls fetch application`, async () => {
    const message = {
      messageId: '1234567890',
      body: {
        cattle: 'yes',
        pigs: 'yes',
        organisation: {
          name: 'test-org',
          email: 'test-email'
        }
      },
      applicationProperties: {
        type: fetchApplicationRequestMsgType
      },
      sessionId
    }
    await processApplicationMessage(message, receiver)
    expect(fetchApplication).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })

  test(`${fetchClaimRequestMsgType} message calls fetchClaim`, async () => {
    const message = {
      body: {
        reference: '12342DD'
      },
      applicationProperties: {
        type: fetchClaimRequestMsgType
      }
    }
    await processApplicationMessage(message, receiver)
    expect(fetchClaim).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })
})
