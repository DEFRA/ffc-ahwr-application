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
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = appInsightsConnectionString
  })

  test('is started when env var exists', () => {
    const appName = 'test-app'
    process.env.APPINSIGHTS_CLOUDROLE = appName
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING = 'something'

    setup()

    expect(setupMock).toHaveBeenCalledTimes(1)
    expect(startMock).toHaveBeenCalledTimes(1)
    expect(tags[cloudRoleTag]).toEqual(appName)
  })
})
