const { when, resetAllWhenMocks } = require('jest-when')
const appInsights = require('applicationinsights')
const { sendFarmerConfirmationEmail } = require('../../../../../app/lib/send-email')
const applicationRepository = require('../../../../../app/repositories/application-repository')
const { processApplication, processApplicationApi, processApplicationQueue } = require('../../../../../app/messaging/application/process-application')
const applicationStatus = require('../../../../../app/constants/application-status')
const sendMessage = require('../../../../../app/messaging/send-message')

const consoleErrorSpy = jest.spyOn(console, 'error')

const MOCK_REFERENCE = 'AHWR-5C1C-DD6Z'
const MOCK_NW_REFERENCE = 'IAHW-5C1C-DD6Z'
const MOCK_TEMP_NW_REFERENCE = 'TEMP-5C1C-DD6Z'
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
const { tenMonthRule, endemics } = require('../../../../../app/config')

const toggle10Months = (toggle) => {
  tenMonthRule.enabled = toggle
}

const toggleEndemics = (toggle) => {
  endemics.enabled = toggle
}

jest.mock('../../../../../app/lib/send-email')
jest.mock('../../../../../app/messaging/send-message')
jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/messaging/send-message')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

describe(('Store application in database'), () => {
  const email = 'email@domain.com'
  const orgEmail = 'org-email@domain.com'
  const name = 'name-on-org'

  const data = {
    confirmCheckDetails: 'yes',
    whichReview: 'beef',
    eligibleSpecies: 'yes',
    reference: MOCK_REFERENCE,
    declaration: true,
    offerStatus: 'accepted',
    organisation: {
      farmerName: 'A Farmer',
      name,
      email,
      orgEmail,
      sbi: '123456789',
      cph: '123/456/789',
      address: '1 Some Street',
      isTest: true
    }
  }

  const nwData = {
    ...data,
    reference: MOCK_TEMP_NW_REFERENCE
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
    toggleEndemics(false)
  })

  test('successfully submits application', async () => {
    await processApplication(data)
    expect(applicationRepository.set).toHaveBeenCalledTimes(1)
    expect(applicationRepository.set).toHaveBeenCalledWith(expect.objectContaining({
      reference: MOCK_REFERENCE,
      data,
      createdBy: 'admin',
      createdAt: expect.any(Date),
      statusId: applicationStatus.agreed
    }))
  })

  test('successfully submits application - with endemics enabled', async () => {
    toggleEndemics(true)
    await processApplication(nwData)

    expect(applicationRepository.set).toHaveBeenCalledTimes(1)
    expect(applicationRepository.set).toHaveBeenCalledWith(expect.objectContaining({
      reference: MOCK_NW_REFERENCE,
      data: nwData,
      createdBy: 'admin',
      createdAt: expect.any(Date),
      statusId: applicationStatus.agreed
    }))
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

      await processApplication(data)

      expect(applicationRepository.set).toHaveBeenCalledTimes(1)
      expect(applicationRepository.set).toHaveBeenCalledWith(expect.objectContaining({
        reference: MOCK_REFERENCE,
        data,
        createdBy: 'admin',
        createdAt: expect.any(Date),
        statusId: applicationStatus.agreed
      }))
    })

    describe('when endemics toggle is enabled', () => {
      beforeEach(() => toggleEndemics(true))

      test('throws an error when existing endemics application', async () => {
        const mockApplicationDate = mockMonthsAgo(30)

        when(applicationRepository.getBySbi)
          .calledWith(
            data.organisation.sbi
          )
          .mockResolvedValue({
            dataValues: {
              reference: MOCK_NW_REFERENCE
            },
            statusId: applicationStatus.readyToPay,
            createdAt: mockApplicationDate,
            type: 'EE'
          })

        await processApplication(data)

        expect(applicationRepository.set).toHaveBeenCalledTimes(0)
        expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to process application',
          new Error(`Recent application already exists: ${JSON.stringify({
            reference: MOCK_NW_REFERENCE,
            createdAt: mockApplicationDate
          })}`)
        )
      })

      test('submits and does not throw an error with statusId 9 (ready to pay) and date more than 10 months ago', async () => {
        const mockApplicationDate = mockMonthsAgo(11)
        when(applicationRepository.getBySbi)
          .calledWith(
            data.organisation.sbi
          )
          .mockResolvedValue({
            dataValues: {
              reference: MOCK_REFERENCE
            },
            createdAt: mockApplicationDate,
            statusId: applicationStatus.readyToPay,
            type: 'VV'
          })

        await processApplication(data)

        expect(applicationRepository.set).toHaveBeenCalledTimes(1)
        expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(1)
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
            data.organisation.sbi
          )
          .mockResolvedValue({
            dataValues: {
              reference: MOCK_REFERENCE
            },
            statusId: applicationStatus.readyToPay,
            createdAt: mockApplicationDate
          })

        await processApplication(data)

        expect(applicationRepository.set).toHaveBeenCalledTimes(0)
        expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to process application',
          new Error(`Recent application already exists: ${JSON.stringify({
            reference: MOCK_REFERENCE,
            createdAt: mockApplicationDate
          })}`)
        )
      })

      test('submits and does not throw an error with statusId 9 (ready to pay) and date more than 10 months ago', async () => {
        const mockApplicationDate = mockMonthsAgo(11)
        when(applicationRepository.getBySbi)
          .calledWith(
            data.organisation.sbi
          )
          .mockResolvedValue({
            dataValues: {
              reference: MOCK_REFERENCE
            },
            createdAt: mockApplicationDate,
            statusId: applicationStatus.readyToPay
          })

        await processApplication(data)

        expect(applicationRepository.set).toHaveBeenCalledTimes(1)
        expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(1)
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
            data.organisation.sbi
          )
          .mockResolvedValue({
            dataValues: {
              reference: MOCK_REFERENCE
            },
            createdAt: mockApplicationDate,
            statusId: applicationStatus.readyToPay
          })

        await processApplication(data)

        expect(applicationRepository.set).toHaveBeenCalledTimes(0)
        expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to process application',
          new Error(`Recent application already exists: ${JSON.stringify({
            reference: MOCK_REFERENCE,
            createdAt: mockApplicationDate
          })}`)
        )
      })

      test('throws an error with statusId 9 (ready to pay) and date more than 10 months ago', async () => {
        const mockApplicationDate = mockMonthsAgo(11)

        when(applicationRepository.getBySbi)
          .calledWith(
            data.organisation.sbi
          )
          .mockResolvedValue({
            dataValues: {
              reference: MOCK_REFERENCE
            },
            createdAt: mockApplicationDate,
            statusId: applicationStatus.readyToPay
          })

        await processApplication(data)

        expect(applicationRepository.set).toHaveBeenCalledTimes(0)
        expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to process application',
          new Error(`Recent application already exists: ${JSON.stringify({
            reference: MOCK_REFERENCE,
            createdAt: mockApplicationDate
          })}`)
        )
      })
    })
  })

  test('successfully submits when application rejected', async () => {
    applicationRepository.set.mockResolvedValue({
      dataValues: { reference: MOCK_REFERENCE }
    })

    data.offerStatus = 'rejected'
    await processApplication(data)

    expect(applicationRepository.set).toHaveBeenCalledTimes(1)
    expect(applicationRepository.set).toHaveBeenCalledWith(expect.objectContaining({
      reference: MOCK_REFERENCE,
      data,
      createdBy: 'admin',
      createdAt: expect.any(Date),
      statusId: applicationStatus.notAgreed,
      type: 'VV'
    }))
  })

  test('Sends failed state on db error and no email is sent', async () => {
    applicationRepository.set.mockResolvedValue(new Error('bust'))

    await processApplication(data)

    expect(sendFarmerConfirmationEmail).not.toHaveBeenCalled()
  })

  test('Application submission message validation failed', async () => {
    const consoleSpy = jest.spyOn(console, 'error')
    delete data.organisation.email
    await processApplication(data)
    expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
    expect(consoleSpy).toHaveBeenNthCalledWith(1, 'Application validation error - ValidationError: "organisation.email" is required.')
  })

  describe('processApplicationApi', () => {
    const data2 = {
      confirmCheckDetails: 'yes',
      whichReview: 'beef',
      eligibleSpecies: 'yes',
      reference: 'AHWR-5C1C-DD6Z',
      declaration: true,
      offerStatus: 'accepted',
      organisation: {
        farmerName: 'A Farmer',
        name,
        email,
        orgEmail,
        sbi: '123456789',
        cph: '123/456/789',
        address: '1 Some Street',
        isTest: true
      }
    }

    test('successfully process Application', async () => {
      const response = await processApplicationApi(data2)

      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith(expect.objectContaining({
        name: 'process-application-api',
        properties: {
          status: data2.offerStatus,
          reference: response.applicationReference,
          sbi: data2.organisation.sbi
        }
      }))

      expect(response).toEqual(expect.objectContaining({
        applicationReference: MOCK_REFERENCE,
        applicationState: 'submitted'
      }))
    })

    test('fail to process application via API', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      const response = await processApplicationApi({ some: 'invalid data' })

      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, 'Application validation error - ValidationError: "confirmCheckDetails" is required.')
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(2, 'Failed to process application', expect.anything())
      expect(response).toEqual(expect.objectContaining({
        applicationReference: null,
        applicationState: 'failed'
      }))
    })
  })

  describe('processApplicationQueue', () => {
    const data2 = {
      confirmCheckDetails: 'yes',
      whichReview: 'beef',
      eligibleSpecies: 'yes',
      reference: 'AHWR-5C1C-DD6Z',
      declaration: true,
      offerStatus: 'accepted',
      organisation: {
        farmerName: 'A Farmer',
        name,
        email,
        orgEmail,
        sbi: '123456789',
        cph: '123/456/789',
        address: '1 Some Street',
        isTest: true
      }
    }

    test('fail to send confirmation email', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      sendFarmerConfirmationEmail.mockImplementation(() => { throw new Error() })

      await processApplication(data2)
      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, 'Failed to send farmer confirmation email', expect.anything())
      expect(applicationRepository.set).toHaveBeenCalledTimes(1)
    })

    test('successfully process Application', async () => {
      await processApplicationQueue(data2)

      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith(expect.objectContaining({
        name: 'process-application-queue'
      }))

      expect(sendMessage).toHaveBeenCalledTimes(1)
    })

    test('fail to process application via queue', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      await processApplicationQueue({ some: 'invalid data' })

      expect(consoleErrorSpy).toHaveBeenNthCalledWith(1, 'Failed to process application', expect.anything())
    })
  })
})
