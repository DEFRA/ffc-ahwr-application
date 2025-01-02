// const dbHelper = require('../../../db-helper')
const { applicationRequestMsgType, fetchApplicationRequestMsgType, fetchClaimRequestMsgType, submitClaimRequestMsgType } = require('../../../../app/config')
const fetchApplication = require('../../../../app/messaging/application/fetch-application').default
const fetchClaim = require('../../../../app/messaging/application/fetch-claim').default
const processApplicationMessage = require('../../../../app/messaging/process-message')
const submitClaim = require('../../../../app/messaging/application/submit-claim').default
const { processApplicationQueue } = require('../../../../app/messaging/application/process-application')
jest.mock('../../../../app/messaging/application/process-application')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

jest.mock('../../../../app/messaging/application/fetch-application')
jest.mock('../../../../app/messaging/application/fetch-claim')
jest.mock('../../../../app/messaging/application/process-application')
jest.mock('../../../../app/messaging/application/submit-claim')

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

  test(`${submitClaimRequestMsgType} message calls submitClaim`, async () => {
    const message = {
      body: {
        reference: '12342DD'
      },
      applicationProperties: {
        type: submitClaimRequestMsgType
      }
    }
    await processApplicationMessage(message, receiver)
    expect(submitClaim).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })
})
