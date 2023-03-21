const { when, resetAllWhenMocks } = require('jest-when')

jest.mock('../../../../../app/data')
jest.mock('../../../../../app/plugins/process-compliance-application')

const server = require('../../../../../app/server')

describe('/api/applications/latest', () => {
  const API_URL = '/api/applications/latest'
  const MOCK_NOW = new Date()
  let logSpy
  let errorSpy
  let dateSpy
  let db

  beforeAll(async () => {
    logSpy = jest.spyOn(console, 'log')
    errorSpy = jest.spyOn(console, 'error')

    db = require('../../../../../app/data')

    dateSpy = jest
      .spyOn(global, 'Date')
      .mockImplementation(() => MOCK_NOW)
    Date.now = jest.fn(() => MOCK_NOW.valueOf())

    await server.start()
  })

  afterAll(async () => {
    await server.stop()
    jest.resetModules()
    dateSpy.mockRestore()
  })

  afterEach(() => {
    jest.clearAllMocks()
    resetAllWhenMocks()
  })

  test.each([
    {
      toString: () => 'no applications found',
      given: {
        queryString: '?businessEmail=business@email.com',
        businessEmail: 'business@email.com'
      },
      when: {
        foundApplications: []
      },
      expect: {
        payload: [],
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Getting latest applications by: ${JSON.stringify({
            businessEmail: 'business@email.com'
          })}`
        ]
      }
    },
    {
      toString: () => 'one latest application found',
      given: {
        queryString: '?businessEmail=business@email.com',
        businessEmail: 'business@email.com'
      },
      when: {
        foundApplications: [
          {
            id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
            reference: 'AHWR-5C1C-DD6A',
            data: {
              reference: 'string',
              declaration: true,
              offerStatus: 'accepted',
              whichReview: 'sheep',
              organisation: {
                crn: 112222,
                sbi: 112222,
                name: 'My Amazing Farm',
                email: 'business@email.com',
                address: '1 Example Road',
                farmerName: 'Mr Farmer'
              },
              eligibleSpecies: 'yes',
              confirmCheckDetails: 'yes'
            },
            claimed: false,
            createdAt: '2023-01-17 13:55:20',
            updatedAt: '2023-01-17 13:55:20',
            createdBy: 'David Jones',
            updatedBy: 'David Jones',
            statusId: 1
          }
        ]
      },
      expect: {
        payload: [
          {
            id: 'eaf9b180-9993-4f3f-a1ec-4422d48edf92',
            reference: 'AHWR-5C1C-DD6A',
            data: {
              reference: 'string',
              declaration: true,
              offerStatus: 'accepted',
              whichReview: 'sheep',
              organisation: {
                crn: 112222,
                sbi: 112222,
                name: 'My Amazing Farm',
                email: 'business@email.com',
                address: '1 Example Road',
                farmerName: 'Mr Farmer'
              },
              eligibleSpecies: 'yes',
              confirmCheckDetails: 'yes'
            },
            claimed: false,
            createdAt: '2023-01-17 13:55:20',
            updatedAt: '2023-01-17 13:55:20',
            createdBy: 'David Jones',
            updatedBy: 'David Jones',
            statusId: 1
          }
        ],
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Getting latest applications by: ${JSON.stringify({
            businessEmail: 'business@email.com'
          })}`
        ]
      }
    }
  ])('%s', async (testCase) => {
    const options = {
      method: 'GET',
      url: `${API_URL}${testCase.given.queryString}`
    }
    when(db.models.application.findAll)
      .calledWith({
        where: { 'data.organisation.email': testCase.given.businessEmail.toLowerCase() },
        order: [['createdAt', 'DESC']],
        raw: true
      })
      .mockResolvedValue(testCase.when.foundApplications)

    const response = await server.inject(options)
    const payload = JSON.parse(response.payload)

    expect(response.statusCode).toBe(200)
    expect(payload).toEqual(testCase.expect.payload)
    testCase.expect.consoleLogs.forEach(
      (consoleLog, idx) => expect(logSpy).toHaveBeenNthCalledWith(idx + 1, consoleLog)
    )
  })

  test.each([
    {
      toString: () => 'error thrown while accessing the db',
      given: {
        queryString: '?businessEmail=business@email.com',
        businessEmail: 'business@email.com'
      },
      when: {
        error: new Error('BOOM')
      },
      expect: {
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Getting latest applications by: ${JSON.stringify({
            businessEmail: 'business@email.com'
          })}`
        ],
        errorLogs: [
          `${MOCK_NOW.toISOString()} Error while getting latest applications by ${JSON.stringify({
            businessEmail: 'business@email.com'
          })}`
        ]
      }
    }
  ])('%s', async (testCase) => {
    const options = {
      method: 'GET',
      url: `${API_URL}${testCase.given.queryString}`
    }
    when(db.models.application.findAll)
      .calledWith({
        where: { 'data.organisation.email': testCase.given.businessEmail.toLowerCase() },
        order: [['createdAt', 'DESC']],
        raw: true
      })
      .mockRejectedValue(testCase.when.error)

    const response = await server.inject(options)

    expect(response.statusCode).toBe(500)
    testCase.expect.consoleLogs.forEach(
      (consoleLog, idx) => expect(logSpy).toHaveBeenNthCalledWith(idx + 1, consoleLog)
    )
    testCase.expect.errorLogs.forEach(
      (errorLog, idx) => expect(errorSpy).toHaveBeenNthCalledWith(idx + 1, errorLog, testCase.when.error)
    )
  })

  test.each([
    {
      toString: () => 'empty query string',
      given: {
        queryString: ''
      },
      then: {
        errorMessage: '"businessEmail" or "sbi" query param must be provided'
      }
    },
    {
      toString: () => 'no "businessEmail" provided',
      given: {
        queryString: '?businessEmail='
      },
      then: {
        errorMessage: '"businessEmail" is not allowed to be empty'
      }
    },
    {
      toString: () => 'no "sbi" provided',
      given: {
        queryString: '?sbi='
      },
      then: {
        errorMessage: 'The SBI number must have 9 digits'
      }
    }
  ])('%s', async (testCase) => {
    const options = {
      method: 'GET',
      url: `${API_URL}${testCase.given.queryString}`
    }

    const response = await server.inject(options)
    const payload = JSON.parse(response.payload)

    expect(response.statusCode).toBe(400)
    expect(response.statusMessage).toEqual('Bad Request')
    expect(payload.message).toEqual(testCase.then.errorMessage)
  })
})
