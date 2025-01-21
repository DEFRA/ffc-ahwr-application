import { getMessageQueueConfig } from '../../../../app/config/message-queue'

describe('Message queue Config Test', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  test('Should pass validation for all fields populated', async () => {
    expect(getMessageQueueConfig()).toBeDefined()
  })

  test('Invalid env var throws error', () => {
    process.env.MESSAGE_QUEUE_HOST = null

    expect(() => getMessageQueueConfig()).toThrow(
      'The message queue config is invalid. "applicationDocCreationRequestQueue.host" must be a string. "applicationRequestQueue.host" must be a string. "applicationResponseQueue.host" must be a string. "submitRequestQueue.host" must be a string. "eventQueue.host" must be a string. "sfdMessageQueue.host" must be a string'
    )
  })
})
