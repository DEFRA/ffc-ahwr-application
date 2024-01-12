describe('process-application-schema', () => {
  jest.mock('../../../../app/config/index', () => ({
    ...jest.requireActual('../../../../app/config/index'),
    endemics: {
      enabled: false
    }
  }))

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test.each([
    {
      toString: () => 'valid email',
      given: {
        data: {
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
            address: '1 Some Street'
          }
        }
      },
      expect: {
        result: {
          value: true
        }
      }
    },
    {
      toString: () => 'email with non IANA registry top level domain',
      given: {
        data: {
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
            address: '1 Some Street'
          }
        }
      },
      expect: {
        result: {
          value: true
        }
      }
    }
  ])('%s', async (testCase) => {
    const validateApplication = require('../../../../app/messaging/schema/process-application-schema')
    const result = validateApplication(testCase.given.data)
    expect(result).toEqual(testCase.expect.result.value)
    if (typeof result.error === 'undefined') {
      expect(result.error).toBeUndefined()
    } else {
      console.log(`error is ${result.error.message}`)
      expect(result.error.message).toEqual(testCase.expect.result.error.message)
    }
  })

  test('Validates endemics application schema', () => {
    const validateApplication = require('../../../../app/messaging/schema/process-application-schema')
    jest.mock('../../../../app/config/index', () => ({
      ...jest.requireActual('../../../../app/config/index'),
      endemics: {
        enabled: true
      }
    }))

    const data = {
      confirmCheckDetails: 'yes',
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
        appliedBefore: 'newUser'
      },
      type: 'EE'
    }

    expect(validateApplication(data)).toEqual(true)
  })
})
