const dbHelper = require('../../../../db-helper')
const { models } = require('../../../../../app/data')
const processApplication = require('../../../../../app/messaging/application/process-application')
const boom = require('@hapi/boom')

const { sendFarmerConfirmationEmail } = require('../../../../../app/lib/send-email')
jest.mock('../../../../../app/lib/send-email')

const sendMessage = require('../../../../../app/messaging/send-message')
jest.mock('../../../../../app/messaging/send-message')
boom.internal = jest.fn()

describe('Process Message test', () => {
  const message = {
    body: {
      confirmCheckDetails: 'yes',
      whichReview: 'beef',
      eligibleSpecies: 'yes',
      reference: null,
      declaration: true,
      offerStatus: 'accepted',
      organisation: {
        farmerName: 'A Farmer',
        name: 'A Farm',
        email: 'email@domain.com',
        sbi: '123456789',
        cph: '123/456/789',
        address: '1 Some Street',
        isTest: true
      }
    },
    applicationProperties: {
      type: 'uk.gov.ffc.ahwr.app.request'
    },
    sessionId: '23423'
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

    expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    const applications = await models.application.findAll({ where: { createdBy: 'admin' }, raw: true })
    expect(applications.length).toBe(1)
  })

  test('Call processApplicationMessage fail to send email', async () => {
    await processApplication(message)

    expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    const applications = await models.application.findAll({ where: { createdBy: 'admin' }, raw: true })
    expect(applications.length).toBe(1)
  })

  test('Call processApplicationMessage fail to send message', async () => {
    sendMessage.mockResolvedValue(() => { throw new Error('error error error') })

    await processApplication(message)

    expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    const applications = await models.application.findAll({ where: { createdBy: 'admin' }, raw: true })
    expect(applications.length).toBe(1)
  })

  test('Call processApplicationMessage message validation failed', async () => {
    const consoleSpy = jest.spyOn(console, 'error')
    delete message.body.organisation.email
    await processApplication(message)
    expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(consoleSpy).toHaveBeenNthCalledWith(1, 'Application validation error - ValidationError: "organisation.email" is required.')
  })
})
