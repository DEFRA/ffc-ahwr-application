import { getNotifyConfig } from '../../../../app/config/notify'

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
    expect(getNotifyConfig()).toBeDefined()
  })

  test('Invalid env var throws error', () => {
    process.env.CARBON_COPY_EMAIL_ADDRESS = 1
    expect(() => getNotifyConfig()).toThrow('Notify config is invalid. "carbonCopyEmailAddress" must be a string')
  })
})
