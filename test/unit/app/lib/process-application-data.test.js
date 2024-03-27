const { resetAllWhenMocks } = require('jest-when')
const { processApplicationData } = require('../../../../app/lib/process-application-data')
const validateApplication = require('../../../../app/messaging/schema/process-application-schema')
const { sendFarmerConfirmationEmail } = require('../../../../app/lib/send-email')
const applicationRepository = require('../../../../app/repositories/application-repository')
jest.mock('../../../../app/repositories/application-repository', () => {
  return {
    getBySbi: jest.fn({ sbi: '123456789' }),
    set: jest.fn()
  }
})

const MOCK_REFERENCE = 'MOCK_REFERENCE'

jest.mock('../../../../app/lib/send-email')
jest.mock('../../../../app/repositories/application-repository')
jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

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

describe('process application data tests', () => {
  const applicationData = {
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
    },
    applicationProperties: {
      type: 'uk.gov.ffc.ahwr.app.request'
    }

  }
  const sessionId = '23423'

  test('validate the application data', async () => {
    expect(typeof validateApplication).toBe('function')
  })

  test('send confirmation email for accepted application', async () => {
    const emailData = { name: applicationData.organisation?.farmerName, orgEmail: applicationData.organisation?.email, sbi: applicationData.organisation.sbi }
    await sendFarmerConfirmationEmail(emailData)

    expect(sendFarmerConfirmationEmail).toHaveBeenCalledWith(emailData)
  })

  test('not send email', async () => {
    applicationRepository.set.mockResolvedValue(new Error('bust'))

    await processApplicationData(applicationData, sessionId)

    expect(sendFarmerConfirmationEmail).not.toHaveBeenCalled()
  })
  test('handle errors during application processing', async () => {
    const data = {}
    await processApplicationData(data)

    expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(0)
  })
})
