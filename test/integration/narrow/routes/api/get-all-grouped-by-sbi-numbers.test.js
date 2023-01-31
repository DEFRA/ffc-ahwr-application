const { when, resetAllWhenMocks } = require('jest-when')
const { Op } = require('sequelize')

jest.mock('../../../../../app/data')
jest.mock('../../../../../app/plugins/process-compliance-application')

const server = require('../../../../../app/server')

describe('getAllGroupedBySbiNumbers', () => {
  const API_URL = '/api/application/getAllGroupedBySbiNumbers'
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
        queryString: '?sbi=123456789',
        sbiNumbers: ['123456789']
      },
      when: {
        foundApplications: []
      },
      expect: {
        payload: [
          {
            sbi: '123456789',
            applications: []
          }
        ],
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Getting all applications grouped by SBI numbers: ${JSON.stringify(
            ['123456789']
          )}`
        ]
      }
    },
    {
      toString: () => 'one application found',
      given: {
        queryString: '?sbi=123456789&sbi=555555555',
        sbiNumbers: ['123456789', '555555555']
      },
      when: {
        foundApplications: [
          {
            sbi: '123456789',
            'application.reference': 'AHWR-5C1C-DD6A',
            'application.status': 'AGREED'
          }
        ]
      },
      expect: {
        payload: [
          {
            sbi: '123456789',
            applications: [
              {
                reference: 'AHWR-5C1C-DD6A',
                status: 'AGREED'
              }
            ]
          },
          {
            sbi: '555555555',
            applications: []
          }
        ],
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Getting all applications grouped by SBI numbers: ${JSON.stringify(
            ['123456789', '555555555']
          )}`
        ]
      }
    }
  ])('%s', async (testCase) => {
    const options = {
      method: 'GET',
      url: `${API_URL}${testCase.given.queryString}`
    }
    when(db.sequelize.json)
      .calledWith('data.organisation.sbi')
      .mockReturnValue('JSON_SBI')
    when(db.sequelize.col)
      .calledWith('reference')
      .mockReturnValue('COL_REFERENCE')
    when(db.sequelize.col)
      .calledWith('status.status')
      .mockReturnValue('COL_STATUS')
    when(db.models.application.findAll)
      .calledWith({
        attributes: [
          ['JSON_SBI', 'sbi'],
          ['COL_REFERENCE', 'application.reference'],
          ['COL_STATUS', 'application.status']
        ],
        where: {
          'data.organisation.sbi': {
            [Op.in]: testCase.given.sbiNumbers
          }
        },
        include: [
          {
            model: db.models.status,
            attributes: []
          }
        ],
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
        queryString: '?sbi=123456789',
        sbiNumbers: ['123456789']
      },
      when: {
        error: new Error('BOOM')
      },
      expect: {
        consoleLogs: [
          `${MOCK_NOW.toISOString()} Getting all applications grouped by SBI numbers: ${JSON.stringify(
            ['123456789']
          )}`
        ],
        errorLogs: [
          `${MOCK_NOW.toISOString()} Error while getting all applications grouped by SBI numbers: `
        ]
      }
    }
  ])('%s', async (testCase) => {
    const options = {
      method: 'GET',
      url: `${API_URL}${testCase.given.queryString}`
    }
    when(db.sequelize.json)
      .calledWith('data.organisation.sbi')
      .mockReturnValue('JSON_SBI')
    when(db.sequelize.col)
      .calledWith('reference')
      .mockReturnValue('COL_REFERENCE')
    when(db.sequelize.col)
      .calledWith('status.status')
      .mockReturnValue('COL_STATUS')
    when(db.models.application.findAll)
      .calledWith({
        attributes: [
          ['JSON_SBI', 'sbi'],
          ['COL_REFERENCE', 'application.reference'],
          ['COL_STATUS', 'application.status']
        ],
        where: {
          'data.organisation.sbi': {
            [Op.in]: testCase.given.sbiNumbers
          }
        },
        include: [
          {
            model: db.models.status,
            attributes: []
          }
        ],
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
      }
    },
    {
      toString: () => 'no SBI number provided',
      given: {
        queryString: '?sbi='
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
    expect(payload.message).toEqual('At least one query param "sbi" must be provided.')
  })
})
