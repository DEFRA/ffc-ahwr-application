const { resetAllWhenMocks } = require('jest-when')

jest.mock('../../../../../app/data')

const server = require('../../../../../app/server')

describe('/api/applications/latest', () => {
  const API_URL = '/api/applications/latest'
  const MOCK_NOW = new Date()
  let dateSpy

  beforeAll(async () => {
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
      toString: () => 'empty query string',
      given: {
        queryString: ''
      },
      then: {
        errorMessage: '"sbi" query param must be provided'
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
