const dbHelper = require('../../../db-helper')
const { backOfficeRequestMsgType } = require('../../../../app/config')
const processBackOfficeMessage = require('../../../../app/messaging/process-backoffice')
const processBackOfficeMessageMessage = require('../../../../app/messaging/process-backoffice-message')

jest.mock('../../../../app/messaging/process-backoffice')

describe('Process BackOffice Message test', () => {
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

  test(`${backOfficeRequestMsgType} message calls processBackOfficeMessage`, async () => {
    const message = {
      body: {
        sbi: '444444444',
        offset: 0,
        limit: 10
      },
      applicationProperties: {
        type: backOfficeRequestMsgType
      },
      sessionId
    }
    await processBackOfficeMessageMessage(message, receiver)
    expect(processBackOfficeMessage).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })
})
