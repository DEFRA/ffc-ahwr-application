import applicationInsights from 'applicationinsights'
import { setup } from '../../app/insights'

jest.mock('applicationinsights', () => ({}))

describe('Application Insights', () => {
  const startMock = jest.fn()
  const setupMock = jest.fn(() => {
    return {
      start: startMock
    }
  })

  applicationInsights.setup = setupMock
  const cloudRoleTag = 'cloudRoleTag'
  const tags = {}
  applicationInsights.defaultClient = {
    context: {
      keys: {
        cloudRole: cloudRoleTag
      },
      tags
    }
  }

  const appInsightsConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING

  beforeEach(() => {
    delete process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
    delete process.env.APPINSIGHTS_CLOUDROLE
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = appInsightsConnectionString
  })

  test('is started when env var exists', () => {
    const appName = 'test-app'
    process.env.APPINSIGHTS_CLOUDROLE = appName
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'something'
    const result = setup()

    expect(result).toBeTruthy()

    expect(setupMock).toHaveBeenCalledTimes(1)
    expect(startMock).toHaveBeenCalledTimes(1)

    expect(tags[cloudRoleTag]).toEqual(appName)
  })

  test('is started when env var exists with default appName', () => {
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'something'
    const result = setup()

    expect(result).toBeTruthy()
    expect(setupMock).toHaveBeenCalledTimes(1)
    expect(startMock).toHaveBeenCalledTimes(1)

    expect(tags[cloudRoleTag]).toEqual('ffc-ahwr-application')
  })

  test('is not started when env var does not exist', () => {
    delete process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
    const result = setup()

    expect(result).toBeFalsy()
    expect(setupMock).toHaveBeenCalledTimes(0)
    expect(startMock).toHaveBeenCalledTimes(0)
  })
})
