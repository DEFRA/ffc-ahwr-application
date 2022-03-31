const dbHelper = require('../../../../db-helper')
const { models } = require('../../../../../app/data')
const processApplicationMessage = require('../../../../../app/messaging/process-message')
const sendEmail = require('../../../../../app/lib/send-email')
const sendMessage = require('../../../../../app/messaging/send-message')
const boom = require('@hapi/boom')

jest.mock('../../../../../app/lib/send-email')
jest.mock('../../../../../app/messaging/send-message')
boom.internal = jest.fn()

describe('Process Message test', () => {
  const message = {
    body: {
      cattle: 'yes',
      pigs: 'yes',
      sessionId: '23423',
      organisation: {
        name: 'test-org',
        email: 'test-email'
      }
    }
  }
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

  test('Call processApplicationMessage success', async () => {
    sendEmail.mockResolvedValue(true)
    await processApplicationMessage(message, receiver)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    const applications = await models.application.findAll({ where: { createdBy: 'admin' }, raw: true })
    expect(applications.length).toBe(1)
  })

  test('Call processApplicationMessage fail to send email', async () => {
    sendEmail.mockResolvedValue(false)
    await processApplicationMessage(message, receiver)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    const applications = await models.application.findAll({ where: { createdBy: 'admin' }, raw: true })
    expect(applications.length).toBe(1)
  })

  test('Call processApplicationMessage fail to send message', async () => {
    sendMessage.mockResolvedValue(() => { throw new Error('error error error') })
    await processApplicationMessage(message, receiver)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    const applications = await models.application.findAll({ where: { createdBy: 'admin' }, raw: true })
    expect(applications.length).toBe(1)
  })
})
