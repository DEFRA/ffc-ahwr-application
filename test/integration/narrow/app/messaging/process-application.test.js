import { processApplication } from '../../../../../app/messaging/application/process-application'
import boom from '@hapi/boom'
import { requestApplicationDocumentGenerateAndEmail } from '../../../../../app/lib/request-email.js'
jest.mock('../../../../../app/lib/request-email.js')

jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))
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
        isTest: true,
        userType: 'newUser'
      },
      type: 'EE'
    },
    applicationProperties: {
      type: 'uk.gov.ffc.ahwr.app.request'
    },
    sessionId: '23423'
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('Call processApplicationMessage message validation failed', async () => {
    const consoleSpy = jest.spyOn(console, 'error')
    delete message.body.organisation.email
    await processApplication(message)
    expect(requestApplicationDocumentGenerateAndEmail).toHaveBeenCalledTimes(0)
    expect(consoleSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('Application validation error - ValidationError: "confirmCheckDetails" is required.'))
  })
})
