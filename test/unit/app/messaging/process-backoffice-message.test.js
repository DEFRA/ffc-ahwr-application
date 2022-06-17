const dbHelper = require('../../../db-helper')
const { backOfficeRequestMsgType, getBackOfficeApplicationRequestMsgType } = require('../../../../app/config')
const processBackOffice = require('../../../../app/messaging/back-office/process-backoffice')
const processBackOfficeMessage = require('../../../../app/messaging/back-office/process-backoffice-message')
const fetchBackOfficeApplication = require('../../../../app/messaging/back-office/fetch-backoffice-application')

jest.mock('../../../../app/messaging/back-office/process-backoffice')
jest.mock('../../../../app/messaging/back-office/fetch-backoffice-application')
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
    await processBackOfficeMessage(message, receiver)
    expect(processBackOffice).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })
  test(`${getBackOfficeApplicationRequestMsgType} message calls fetch applications`, async () => {
    const message = {
      body: {
        reference: '444444444'
      },
      applicationProperties: {
        type: getBackOfficeApplicationRequestMsgType
      },
      sessionId
    }
    await processBackOfficeMessage(message, receiver)
    expect(fetchBackOfficeApplication).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })
})
