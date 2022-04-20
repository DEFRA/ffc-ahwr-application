const dbHelper = require('../../../db-helper')
const processApplicationMessage = require('../../../../app/messaging/process-message')
const processApplication = require('../../../../app/messaging/process-application')
const fetchApplication = require('../../../../app/messaging/fetch-application')
const processVetVisit = require('../../../../app/messaging/process-vet-visit')
const boom = require('@hapi/boom')
const { fetchApplicationRequestMsgType, applicationRequestMsgType, vetVisitRequestMsgType } = require('../../../../app/config')

boom.internal = jest.fn()

jest.mock('../../../../app/messaging/process-application')
jest.mock('../../../../app/messaging/fetch-application')
jest.mock('../../../../app/messaging/process-vet-visit')

describe('Process Message test', () => {
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

  test('Call processApplication success', async () => {
    const message = {
      body: {
        cattle: 'yes',
        pigs: 'yes',
        sessionId: '23423',
        organisation: {
          name: 'test-org',
          email: 'test-email'
        }
      },
      applicationProperties: {
        type: applicationRequestMsgType
      }
    }
    await processApplicationMessage(message, receiver)
    expect(processApplication).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })
  test('Call fetch application success', async () => {
    const message = {
      body: {
        cattle: 'yes',
        pigs: 'yes',
        sessionId: '23423',
        organisation: {
          name: 'test-org',
          email: 'test-email'
        }
      },
      applicationProperties: {
        type: fetchApplicationRequestMsgType
      }
    }
    await processApplicationMessage(message, receiver)
    expect(fetchApplication).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })
  test('Call fetch application success', async () => {
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
