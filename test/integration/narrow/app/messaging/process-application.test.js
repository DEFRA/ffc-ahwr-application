const dbHelper = require('../../../../db-helper')
const { models } = require('../../../../../app/data')
const processApplication = require('../../../../../app/messaging/process-application')
const sendEmail = require('../../../../../app/lib/send-email')
const sendMessage = require('../../../../../app/messaging/send-message')
const boom = require('@hapi/boom')

sendEmail.sendFarmerConfirmationEmail = jest.fn()
  .mockResolvedValueOnce(true)
  .mockResolvedValueOnce(false)
  .mockResolvedValueOnce(true)

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
    },
    applicationProperties: {
      type: 'uk.gov.ffc.ahwr.app.request'
    }
  }

  beforeEach(async () => {
    await dbHelper.truncate()
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await dbHelper.truncate()
    await dbHelper.close()
  })

  test('Call processApplicationMessage success', async () => {
    await processApplication(message)

    expect(sendEmail.sendFarmerConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    const applications = await models.application.findAll({ where: { createdBy: 'admin' }, raw: true })
    expect(applications.length).toBe(1)
  })

  test('Call processApplicationMessage fail to send email', async () => {
    await processApplication(message)

    expect(sendEmail.sendFarmerConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    const applications = await models.application.findAll({ where: { createdBy: 'admin' }, raw: true })
    expect(applications.length).toBe(1)
  })

  test('Call processApplicationMessage fail to send message', async () => {
    sendMessage.mockResolvedValue(() => { throw new Error('error error error') })

    await processApplication(message)

    expect(sendEmail.sendFarmerConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    const applications = await models.application.findAll({ where: { createdBy: 'admin' }, raw: true })
    expect(applications.length).toBe(1)
  })
})
