const { when, resetAllWhenMocks } = require('jest-when')

jest.mock('../../../../../app/lib/send-email')
const { sendFarmerConfirmationEmail } = require('../../../../../app/lib/send-email')

jest.mock('../../../../../app/messaging/send-message')
const sendMessage = require('../../../../../app/messaging/send-message')

jest.mock('../../../../../app/repositories/application-repository')
const applicationRepository = require('../../../../../app/repositories/application-repository')

const { applicationResponseMsgType, applicationResponseQueue } = require('../../../../../app/config')
const states = require('../../../../../app/messaging/application/states')
const processApplication = require('../../../../../app/messaging/application/process-application')

const consoleErrorSpy = jest.spyOn(console, 'error')

const WITHDRAWN = 2
const NOT_AGREED = 7
const AGREED = 1

describe(('Store application in database'), () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const email = 'email@domain.com'
  const name = 'name-on-org'
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
        name,
        email,
        sbi: '123456789',
        cph: '123/456/789',
        address: '1 Some Street',
        isTest: true
      }
    },
    sessionId
  }

  afterEach(() => {
    jest.clearAllMocks()
    resetAllWhenMocks()
  })

  const reference = '23D13'
  test('successfully submits application', async () => {
    applicationRepository.set.mockResolvedValue({
      dataValues: { reference }
    })
    applicationRepository.getBySbi.mockResolvedValue()

    await processApplication(message)

    expect(applicationRepository.set).toHaveBeenCalledTimes(1)
    expect(applicationRepository.set).toHaveBeenCalledWith(expect.objectContaining({
      reference: '',
      data: message.body,
      createdBy: 'admin',
      createdAt: expect.any(Date),
      statusId: 1
    }))
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.submitted, applicationReference: reference }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('submits an existing application with statusId 1', async () => {
    const MOCK_REFERENCE = 'MOCK_REFERENCE'
    const MOCK_NOW = new Date()

    when(applicationRepository.getBySbi)
      .calledWith(
        message.body.organisation.sbi
      )
      .mockResolvedValue({
        dataValues: {
          reference: MOCK_REFERENCE,
          createdAt: MOCK_NOW
        },
        statusId: AGREED
      })

    await processApplication(message)

    expect(applicationRepository.set).toHaveBeenCalledTimes(0)
    expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to process application',
      new Error(`Application already exists: ${JSON.stringify({
        reference: MOCK_REFERENCE,
        createdAt: MOCK_NOW
      })}`)
    )
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(
      {
        applicationState: states.alreadyExists,
        applicationReference: MOCK_REFERENCE
      },
      applicationResponseMsgType,
      applicationResponseQueue,
      {
        sessionId
      }
    )
  })

  test('submits an existing application with statusId 2', async () => {
    const MOCK_REFERENCE = 'MOCK_REFERENCE'
    const MOCK_NOW = new Date()

    when(applicationRepository.getBySbi)
      .calledWith(
        message.body.organisation.sbi
      )
      .mockResolvedValue({
        dataValues: {
          reference: MOCK_REFERENCE,
          createdAt: MOCK_NOW
        },
        statusId: WITHDRAWN
      })

    expect(applicationRepository.set).toHaveBeenCalledTimes(1)
    expect(applicationRepository.set).toHaveBeenCalledWith(expect.objectContaining({
      reference: '',
      data: message.body,
      createdBy: 'admin',
      createdAt: expect.any(Date),
      statusId: WITHDRAWN
    }))
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.submitted, applicationReference: reference }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('submits an existing application with statusId 7', async () => {
    const MOCK_REFERENCE = 'MOCK_REFERENCE'
    const MOCK_NOW = new Date()

    when(applicationRepository.getBySbi)
      .calledWith(
        message.body.organisation.sbi
      )
      .mockResolvedValue({
        dataValues: {
          reference: MOCK_REFERENCE,
          createdAt: MOCK_NOW
        },
        statusId: NOT_AGREED
      })

    expect(applicationRepository.set).toHaveBeenCalledTimes(1)
    expect(applicationRepository.set).toHaveBeenCalledWith(expect.objectContaining({
      reference: '',
      data: message.body,
      createdBy: 'admin',
      createdAt: expect.any(Date),
      statusId: NOT_AGREED
    }))
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.submitted, applicationReference: reference }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('successfully submits rejected application', async () => {
    applicationRepository.set.mockResolvedValue({
      dataValues: { reference }
    })

    message.body.offerStatus = 'rejected'
    await processApplication(message)

    expect(applicationRepository.set).toHaveBeenCalledTimes(1)
    expect(applicationRepository.set).toHaveBeenCalledWith(expect.objectContaining({
      reference: '',
      data: message.body,
      createdBy: 'admin',
      createdAt: expect.any(Date),
      statusId: 7
    }))
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.submitted, applicationReference: reference }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
    expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
  })

  test('Sends failed state on db error and no email is sent', async () => {
    applicationRepository.set.mockResolvedValue(new Error('bust'))

    await processApplication(message)

    expect(sendFarmerConfirmationEmail).not.toHaveBeenCalled()
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationReference: null, applicationState: states.failed }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('Application submission message validation failed', async () => {
    delete message.body.organisation.isTest
    await processApplication(message)
    expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationReference: null, applicationState: states.failed }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
  })
})
