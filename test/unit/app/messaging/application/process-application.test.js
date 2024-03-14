const { when, resetAllWhenMocks } = require('jest-when')
const { sendFarmerConfirmationEmail } = require('../../../../../app/lib/send-email')
const sendMessage = require('../../../../../app/messaging/send-message')
const applicationRepository = require('../../../../../app/repositories/application-repository')
const states = require('../../../../../app/messaging/application/states')
const processApplication = require('../../../../../app/messaging/application/process-application')
const applicationStatus = require('../../../../../app/constants/application-status')

const consoleErrorSpy = jest.spyOn(console, 'error')

const MOCK_REFERENCE = 'MOCK_REFERENCE'
const MOCK_NOW = new Date()

const mockMonthsAgo = (months) => {
  const mockDate = new Date()
  return mockDate.setMonth(mockDate.getMonth() - months)
}

jest.mock('../../../../../app/config', () => ({
  ...jest.requireActual('../../../../../app/config'),
  endemics: {
    enabled: false
  }
}))
const { applicationResponseMsgType, applicationResponseQueue, tenMonthRule, endemics } = require('../../../../../app/config')

const toggle10Months = (toggle) => {
  tenMonthRule.enabled = toggle
}

const toggleEndemics = (toggle) => {
  endemics.enabled = toggle
}

jest.mock('../../../../../app/lib/send-email')
jest.mock('../../../../../app/messaging/send-message')
jest.mock('../../../../../app/repositories/application-repository')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

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

  beforeEach(() => {
    applicationRepository.set.mockResolvedValue({
      dataValues: { reference: MOCK_REFERENCE }
    })
    applicationRepository.getBySbi.mockResolvedValue()
  })

  afterEach(() => {
    jest.clearAllMocks()
    resetAllWhenMocks()
  })

  test('successfully submits application', async () => {
    await processApplication(message)

    expect(applicationRepository.set).toHaveBeenCalledTimes(1)
    expect(applicationRepository.set).toHaveBeenCalledWith(expect.objectContaining({
      reference: '',
      data: message.body,
      createdBy: 'admin',
      createdAt: expect.any(Date),
      statusId: applicationStatus.agreed
    }))
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.submitted, applicationReference: MOCK_REFERENCE }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
  })

  describe('Submits an existing application', () => {
    test.each([
      {
        toString: () => ' with statusId 2 (withdrawn)',
        given: {
          sbi: 123456789
        },
        when: {
          statusId: applicationStatus.withdrawn
        }
      },
      {
        toString: () => ' with statusId 7 (not agreed)',
        given: {
          sbi: 123456789
        },
        when: {
          statusId: applicationStatus.notAgreed
        }
      }
    ])('%s', async (testCase) => {
      when(applicationRepository.getBySbi)
        .calledWith(
          testCase.given.sbi
        )
        .mockResolvedValue({
          dataValues: {
            reference: MOCK_REFERENCE
          },
          createdAt: MOCK_NOW,
          statusId: testCase.when.statusId
        })

      await processApplication(message)

      expect(applicationRepository.set).toHaveBeenCalledTimes(1)
      expect(applicationRepository.set).toHaveBeenCalledWith(expect.objectContaining({
        reference: '',
        data: message.body,
        createdBy: 'admin',
        createdAt: expect.any(Date),
        statusId: applicationStatus.agreed
      }))
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.submitted, applicationReference: MOCK_REFERENCE }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
    })

    describe('when endemics toggle is enabled', () => {
      beforeEach(() => toggleEndemics(true))
      test('throws an error when existing endemics application', async () => {
        const mockApplicationDate = mockMonthsAgo(30)

        when(applicationRepository.getBySbi)
          .calledWith(
            message.body.organisation.sbi
          )
          .mockResolvedValue({
            dataValues: {
              reference: MOCK_REFERENCE
            },
            statusId: applicationStatus.readyToPay,
            createdAt: mockApplicationDate,
            type: 'EE'
          })

        await processApplication(message)

        expect(applicationRepository.set).toHaveBeenCalledTimes(0)
        expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to process application',
          new Error(`Recent application already exists: ${JSON.stringify({
            reference: MOCK_REFERENCE,
            createdAt: mockApplicationDate
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

      test('submits and does not throw an error with statusId 9 (ready to pay) and date more than 10 months ago', async () => {
        const mockApplicationDate = mockMonthsAgo(11)
        when(applicationRepository.getBySbi)
          .calledWith(
            message.body.organisation.sbi
          )
          .mockResolvedValue({
            dataValues: {
              reference: MOCK_REFERENCE
            },
            createdAt: mockApplicationDate,
            statusId: applicationStatus.readyToPay,
            type: 'VV'
          })

        await processApplication(message)

        expect(applicationRepository.set).toHaveBeenCalledTimes(1)
        expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(1)
        expect(sendMessage).toHaveBeenCalledTimes(1)
        expect(sendMessage).toHaveBeenCalledWith(
          {
            applicationState: states.submitted,
            applicationReference: MOCK_REFERENCE
          },
          applicationResponseMsgType,
          applicationResponseQueue,
          {
            sessionId
          }
        )
      })
    })

    describe('when 10 month rule toggle is enabled', () => {
      beforeEach(() => {
        toggle10Months(true)
        toggleEndemics(false)
      })
      test('throws an error with statusId 9 (ready to pay) and date less than 10 months ago', async () => {
        const mockApplicationDate = mockMonthsAgo(7)

        when(applicationRepository.getBySbi)
          .calledWith(
            message.body.organisation.sbi
          )
          .mockResolvedValue({
            dataValues: {
              reference: MOCK_REFERENCE
            },
            statusId: applicationStatus.readyToPay,
            createdAt: mockApplicationDate
          })

        await processApplication(message)

        expect(applicationRepository.set).toHaveBeenCalledTimes(0)
        expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to process application',
          new Error(`Recent application already exists: ${JSON.stringify({
            reference: MOCK_REFERENCE,
            createdAt: mockApplicationDate
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

      test('submits and does not throw an error with statusId 9 (ready to pay) and date more than 10 months ago', async () => {
        const mockApplicationDate = mockMonthsAgo(11)
        when(applicationRepository.getBySbi)
          .calledWith(
            message.body.organisation.sbi
          )
          .mockResolvedValue({
            dataValues: {
              reference: MOCK_REFERENCE
            },
            createdAt: mockApplicationDate,
            statusId: applicationStatus.readyToPay
          })

        await processApplication(message)

        expect(applicationRepository.set).toHaveBeenCalledTimes(1)
        expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(1)
        expect(sendMessage).toHaveBeenCalledTimes(1)
        expect(sendMessage).toHaveBeenCalledWith(
          {
            applicationState: states.submitted,
            applicationReference: MOCK_REFERENCE
          },
          applicationResponseMsgType,
          applicationResponseQueue,
          {
            sessionId
          }
        )
      })
    })

    describe('when 10 month rule toggle is not enabled', () => {
      beforeEach(() => {
        toggle10Months(false)
        toggleEndemics(false)
      })

      test('throws an error with statusId 9 (ready to pay) and date less than 10 months ago', async () => {
        const mockApplicationDate = mockMonthsAgo(7)

        when(applicationRepository.getBySbi)
          .calledWith(
            message.body.organisation.sbi
          )
          .mockResolvedValue({
            dataValues: {
              reference: MOCK_REFERENCE
            },
            createdAt: mockApplicationDate,
            statusId: applicationStatus.readyToPay
          })

        await processApplication(message)

        expect(applicationRepository.set).toHaveBeenCalledTimes(0)
        expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to process application',
          new Error(`Recent application already exists: ${JSON.stringify({
            reference: MOCK_REFERENCE,
            createdAt: mockApplicationDate
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

      test('throws an error with statusId 9 (ready to pay) and date more than 10 months ago', async () => {
        const mockApplicationDate = mockMonthsAgo(11)

        when(applicationRepository.getBySbi)
          .calledWith(
            message.body.organisation.sbi
          )
          .mockResolvedValue({
            dataValues: {
              reference: MOCK_REFERENCE
            },
            createdAt: mockApplicationDate,
            statusId: applicationStatus.readyToPay
          })

        await processApplication(message)

        expect(applicationRepository.set).toHaveBeenCalledTimes(0)
        expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to process application',
          new Error(`Recent application already exists: ${JSON.stringify({
            reference: MOCK_REFERENCE,
            createdAt: mockApplicationDate
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
    })
  })

  test('successfully submits when application rejected', async () => {
    applicationRepository.set.mockResolvedValue({
      dataValues: { reference: MOCK_REFERENCE }
    })

    message.body.offerStatus = 'rejected'
    await processApplication(message)

    expect(applicationRepository.set).toHaveBeenCalledTimes(1)
    expect(applicationRepository.set).toHaveBeenCalledWith(expect.objectContaining({
      reference: '',
      data: message.body,
      createdBy: 'admin',
      createdAt: expect.any(Date),
      statusId: applicationStatus.notAgreed
    }))
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.submitted, applicationReference: MOCK_REFERENCE }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
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
    delete message.body.organisation.email
    await processApplication(message)
    expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationReference: null, applicationState: states.failed }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
  })
})
