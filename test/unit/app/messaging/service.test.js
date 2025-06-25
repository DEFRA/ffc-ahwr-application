import { MessageReceiver } from 'ffc-messaging'
import { startMessagingService } from '../../../../app/messaging/service'

jest.mock('ffc-messaging')

const mocksubscribe = jest.fn()
MessageReceiver.prototype.subscribe = mocksubscribe

test('subscribes to messages', async () => {
  const mockInfoLogger = jest.fn()
  const mockLogger = { info: mockInfoLogger }
  await startMessagingService(mockLogger)
  expect(mocksubscribe).toHaveBeenCalledTimes(1)
})
