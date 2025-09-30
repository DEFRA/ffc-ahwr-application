import { when, resetAllWhenMocks } from 'jest-when'
import appInsights from 'applicationinsights'
import { requestApplicationDocumentGenerateAndEmail } from '../../../../../app/lib/request-application-document-generate.js'
import { getBySbi, setApplication } from '../../../../../app/repositories/application-repository'
import { processApplication, processApplicationApi, processApplicationQueue } from '../../../../../app/messaging/application/process-application'
import { applicationStatus } from '../../../../../app/constants'
import { sendMessage } from '../../../../../app/messaging/send-message'

const MOCK_REFERENCE = 'AHWR-5C1C-DD6Z'
const MOCK_NW_REFERENCE = 'IAHW-5C1C-DD6Z'
const MOCK_TEMP_NW_REFERENCE = 'TEMP-5C1C-DD6Z'
const MOCK_NOW = new Date()

const mockMonthsAgo = (months) => {
  const mockDate = new Date()
  return mockDate.setMonth(mockDate.getMonth() - months)
}

jest.mock('../../../../../app/lib/request-application-document-generate.js')
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
      isTest: true,
      userType: 'newUser'
    },
    type: 'VV'
  }

  const nwData = {
    ...data,
    reference: MOCK_TEMP_NW_REFERENCE
  }

  beforeEach(() => {
    setApplication.mockResolvedValue({
      dataValues: { reference: MOCK_REFERENCE }
    })
    getBySbi.mockResolvedValue()
  })

  afterEach(() => {
    jest.clearAllMocks()
    resetAllWhenMocks()
  })

  test('successfully submits application', async () => {
    const mockErrorLogger = jest.fn()
    const mockLogger = { error: mockErrorLogger }
    await processApplication(data, mockLogger)
    expect(setApplication).toHaveBeenCalledTimes(1)
    expect(setApplication).toHaveBeenCalledWith(expect.objectContaining({
      reference: MOCK_REFERENCE,
      data,
      createdBy: 'admin',
      createdAt: expect.any(Date),
      statusId: applicationStatus.agreed
    }))
  })

  test('successfully submits application', async () => {
    const mockErrorLogger = jest.fn()
    const mockLogger = { error: mockErrorLogger }

    await processApplication(nwData, mockLogger)

    expect(setApplication).toHaveBeenCalledTimes(1)
    expect(setApplication).toHaveBeenCalledWith(expect.objectContaining({
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
      when(getBySbi)
        .calledWith(
          testCase.given.sbi
        )
        .mockResolvedValue({
          dataValues: {
            reference: MOCK_REFERENCE
          },
          createdAt: MOCK_NOW,
          statusId: testCase.when.statusId,
          applicationRedacts: []
        })

      const mockErrorLogger = jest.fn()
      const mockLogger = { error: mockErrorLogger }

      await processApplication(data, mockLogger)

      expect(setApplication).toHaveBeenCalledTimes(1)
      expect(setApplication).toHaveBeenCalledWith(expect.objectContaining({
        reference: MOCK_REFERENCE,
        data,
        createdBy: 'admin',
        createdAt: expect.any(Date),
        statusId: applicationStatus.agreed
      }))
    })

    test('throws an error when existing endemics application', async () => {
      const mockApplicationDate = mockMonthsAgo(30)

      when(getBySbi)
        .calledWith(
          data.organisation.sbi
        )
        .mockResolvedValue({
          dataValues: {
            reference: MOCK_NW_REFERENCE,
            createdAt: mockApplicationDate
          },
          statusId: applicationStatus.readyToPay,
          createdAt: mockApplicationDate,
          type: 'EE',
          applicationRedacts: []
        })

      const mockErrorLogger = jest.fn()
      const mockLogger = { error: mockErrorLogger }

      await processApplication(data, mockLogger)

      expect(setApplication).toHaveBeenCalledTimes(0)
      expect(requestApplicationDocumentGenerateAndEmail).toHaveBeenCalledTimes(0)
      expect(mockErrorLogger).toHaveBeenCalledWith(
        new Error(`Recent application already exists: ${JSON.stringify({
          reference: MOCK_NW_REFERENCE,
          createdAt: mockApplicationDate
        })}`),
        'Failed to process application'
      )
    })

    test('submits and does not throw an error with statusId 9 (ready to pay) and date more than 10 months ago', async () => {
      const mockApplicationDate = mockMonthsAgo(11)
      when(getBySbi)
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

      const mockErrorLogger = jest.fn()
      const mockLogger = { error: mockErrorLogger }

      await processApplication(data, mockLogger)

      expect(setApplication).toHaveBeenCalledTimes(1)
      expect(requestApplicationDocumentGenerateAndEmail).toHaveBeenCalledTimes(1)
    })
  })

  test('successfully submits when application rejected', async () => {
    setApplication.mockResolvedValue({
      dataValues: { reference: MOCK_REFERENCE }
    })

    const mockErrorLogger = jest.fn()
    const mockLogger = { error: mockErrorLogger }

    await processApplication({ ...data, offerStatus: 'rejected' }, mockLogger)

    expect(setApplication).toHaveBeenCalledTimes(1)
    expect(setApplication).toHaveBeenCalledWith(expect.objectContaining({
      reference: MOCK_REFERENCE,
      data: { ...data, offerStatus: 'rejected' },
      createdBy: 'admin',
      createdAt: expect.any(Date),
      statusId: applicationStatus.notAgreed,
      type: 'VV'
    }))
  })

  test('Sends failed state on db error and no email is sent', async () => {
    const mockApplicationDate = mockMonthsAgo(11)
    when(getBySbi)
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

    setApplication.mockImplementationOnce(() => {
      throw new Error('bust')
    })
    const mockErrorLogger = jest.fn()
    const mockLogger = { error: mockErrorLogger }

    await processApplication(data, mockLogger)

    expect(requestApplicationDocumentGenerateAndEmail).not.toHaveBeenCalled()
    expect(mockErrorLogger).toHaveBeenCalledWith(expect.any(Error), 'Failed to process application')
  })

  test('Application submission message validation failed', async () => {
    const mockErrorLogger = jest.fn()
    const mockLogger = { error: mockErrorLogger }

    await processApplication({ ...data, organisation: { ...data.organisation, email: undefined } }, mockLogger)

    expect(requestApplicationDocumentGenerateAndEmail).toHaveBeenCalledTimes(0)
    expect(mockErrorLogger).toHaveBeenNthCalledWith(1, expect.stringContaining('Application validation error - ValidationError: "organisation.email" is required.'))
  })

  test('successfully submits when existing application is redacted', async () => {
    when(getBySbi)
      .calledWith(
        data.organisation.sbi
      )
      .mockResolvedValue({
        dataValues: {
          reference: MOCK_REFERENCE
        },
        createdAt: MOCK_NOW,
        statusId: applicationStatus.readyToPay,
        applicationRedacts: [{ success: 'Y' }]
      })
    const mockErrorLogger = jest.fn()
    const mockLogger = { error: mockErrorLogger }

    await processApplication({ ...data, type: 'EE' }, mockLogger)

    expect(setApplication).toHaveBeenCalledTimes(1)
    expect(setApplication).toHaveBeenCalledWith(expect.objectContaining({
      reference: MOCK_REFERENCE,
      data: { ...data, type: 'EE' },
      createdBy: 'admin',
      createdAt: expect.any(Date),
      statusId: applicationStatus.agreed,
      type: 'EE'
    }))
  })

  describe('processApplicationApi', () => {
    const testData = {
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
        isTest: true,
        userType: 'newUser'
      },
      type: 'EE'
    }

    test('successfully process Application', async () => {
      const mockErrorLogger = jest.fn()
      const mockLogger = { error: mockErrorLogger }
      const response = await processApplicationApi(testData, mockLogger)

      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith(expect.objectContaining({
        name: 'process-application-api',
        properties: {
          status: testData.offerStatus,
          reference: response.applicationReference,
          sbi: testData.organisation.sbi
        }
      }))

      expect(response).toEqual(expect.objectContaining({
        applicationReference: MOCK_REFERENCE,
        applicationState: 'submitted'
      }))
    })

    test('fail to process application via API', async () => {
      const mockErrorLogger = jest.fn()
      const mockLogger = { error: mockErrorLogger }
      const response = await processApplicationApi({ some: 'invalid data' }, mockLogger)

      expect(mockErrorLogger).toHaveBeenNthCalledWith(1, expect.stringContaining('Application validation error - ValidationError: "confirmCheckDetails" is required.'))
      expect(mockErrorLogger).toHaveBeenNthCalledWith(2, expect.anything(), 'Failed to process application')
      expect(response).toEqual(expect.objectContaining({
        applicationReference: null,
        applicationState: 'failed'
      }))
    })
  })

  describe('processApplicationQueue', () => {
    const testData = {
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
        isTest: true,
        userType: 'newUser'
      },
      type: 'VV'
    }

    test('fail to send confirmation email', async () => {
      const mockErrorLogger = jest.fn()
      const mockInfoLogger = jest.fn()
      const mockLogger = { error: mockErrorLogger, info: mockInfoLogger }
      requestApplicationDocumentGenerateAndEmail.mockImplementation(() => { throw new Error() })

      await processApplication(testData, mockLogger)
      expect(mockErrorLogger).toHaveBeenNthCalledWith(1, expect.anything(), 'Failed to request application document generation and email')
      expect(setApplication).toHaveBeenCalledTimes(1)
    })

    test('successfully process Application', async () => {
      const mockErrorLogger = jest.fn()
      const mockInfoLogger = jest.fn()
      const mockLogger = { error: mockErrorLogger, info: mockInfoLogger }
      await processApplicationQueue(testData, mockLogger)

      expect(appInsights.defaultClient.trackEvent).toHaveBeenCalledWith(expect.objectContaining({
        name: 'process-application-queue'
      }))

      expect(sendMessage).toHaveBeenCalledTimes(1)
    })

    test('fail to process application via queue', async () => {
      const mockErrorLogger = jest.fn()
      const mockInfoLogger = jest.fn()
      const mockLogger = { error: mockErrorLogger, info: mockInfoLogger }
      await processApplicationQueue({ some: 'invalid data' }, mockLogger)

      expect(mockInfoLogger).toHaveBeenCalledWith('Processing application...')
      expect(mockErrorLogger).toHaveBeenCalledWith(expect.any(Error), 'Failed to process application')
      expect(requestApplicationDocumentGenerateAndEmail).toHaveBeenCalledTimes(0)
    })
  })
})
