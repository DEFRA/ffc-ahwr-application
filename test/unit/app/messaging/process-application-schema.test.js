import { validateApplication } from '../../../../app/messaging/schema/process-application-schema'
import appInsights from 'applicationinsights'

jest.mock('applicationinsights', () => ({ defaultClient: { trackException: jest.fn(), trackEvent: jest.fn() }, dispose: jest.fn() }))

describe('process-application-schema', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('a valid application returns true', () => {
    const application = {
      confirmCheckDetails: 'yes',
      whichReview: 'beef',
      eligibleSpecies: 'yes',
      reference: null,
      declaration: true,
      offerStatus: 'accepted',
      organisation: {
        farmerName: 'A Farmer',
        name: 'organiation name',
        email: 'test@test.com',
        sbi: '123456789',
        cph: '123/456/789',
        address: '1 Some Street',
        userType: 'existingUser'
      },
      type: 'VV'
    }

    expect(validateApplication(application)).toBeTruthy()
  })

  test('a valid application with an email with non IANA registry top level domain returns true', () => {
    const application = {
      confirmCheckDetails: 'yes',
      whichReview: 'beef',
      eligibleSpecies: 'yes',
      reference: null,
      declaration: true,
      offerStatus: 'accepted',
      organisation: {
        farmerName: 'A Farmer',
        name: 'organiation name',
        email: 'hollygriffithsx@shtiffirgyllohm.com.test',
        sbi: '123456789',
        cph: '123/456/789',
        address: '1 Some Street',
        userType: 'newUser'
      },
      type: 'EE'
    }

    expect(validateApplication(application)).toBeTruthy()
  })

  test('an invalid application returns false and calls track exception', () => {
    const application = {
      confirmCheckDetails: undefined,
      whichReview: 'beef',
      eligibleSpecies: 'yes',
      reference: null,
      declaration: true,
      offerStatus: 'accepted',
      organisation: {
        farmerName: 'A Farmer',
        name: 'organiation name',
        email: 'hollygriffithsx@shtiffirgyllohm.com.test',
        sbi: '123456789',
        cph: '123/456/789',
        address: '1 Some Street',
        userType: 'newUser'
      },
      type: 'EE'
    }

    const mockErrorLogger = jest.fn()
    const mockLogger = { error: mockErrorLogger }

    expect(validateApplication(application, mockLogger)).toBeFalsy()
    expect(mockErrorLogger).toHaveBeenCalledWith('Application validation error - ValidationError: "confirmCheckDetails" is required.')
    expect(appInsights.defaultClient.trackException).toHaveBeenCalledTimes(1)
  })
})
