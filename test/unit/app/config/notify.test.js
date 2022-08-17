const notifyConfig = require('../../../../app/config/notify')

describe('Notify Config Test', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })
  test('Should pass validation for all fields populated', async () => {
    expect(notifyConfig).toBeDefined()
  })

  test('Invalid env var throws error', () => {
    try {
      process.env.NOTIFY_API_KEY = null
      require('../../../../app/config/notify')
    } catch (err) {
      expect(err.message).toBe('Notify config is invalid. "apiKey" must be a string')
    }
  })
})
