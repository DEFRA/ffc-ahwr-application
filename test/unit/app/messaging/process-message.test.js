const dbHelper = require('../../../db-helper')
const { applicationRequestMsgType, fetchApplicationRequestMsgType, fetchClaimRequestMsgType, submitClaimRequestMsgType, vetVisitRequestMsgType } = require('../../../../app/config')
const fetchApplication = require('../../../../app/messaging/fetch-application')
const fetchClaim = require('../../../../app/messaging/fetch-claim')
const processApplication = require('../../../../app/messaging/process-application')
const processApplicationMessage = require('../../../../app/messaging/process-message')
const processVetVisit = require('../../../../app/messaging/process-vet-visit')
const submitClaim = require('../../../../app/messaging/submit-claim')

jest.mock('../../../../app/messaging/fetch-application')
jest.mock('../../../../app/messaging/fetch-claim')
jest.mock('../../../../app/messaging/process-application')
jest.mock('../../../../app/messaging/process-vet-visit')
jest.mock('../../../../app/messaging/submit-claim')

describe('Process Message test', () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const receiver = {
    completeMessage: jest.fn(),
    abandonMessage: jest.fn()
  }

  beforeEach(async () => {
    await dbHelper.truncate()
    jest.clearAllMocks()
  })

  afterEach(async () => {
    await dbHelper.truncate()
  })

  afterAll(async () => {
    await dbHelper.close()
  })

  test(`${applicationRequestMsgType} message calls processApplication`, async () => {
    const message = {
      body: {
        cattle: 'yes',
        pigs: 'yes',
        organisation: {
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
    expect(processApplication).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })

  test(`${fetchApplicationRequestMsgType} message calls fetch application`, async () => {
    const message = {
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

  test(`${vetVisitRequestMsgType} message calls processVetVisit`, async () => {
    const message = {
      body: {
        reference: '12342DD'
      },
      applicationProperties: {
        type: vetVisitRequestMsgType
      }
    }
    await processApplicationMessage(message, receiver)
    expect(processVetVisit).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })
})
