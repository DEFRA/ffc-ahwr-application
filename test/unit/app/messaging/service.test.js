import { MessageReceiver } from 'ffc-messaging'
import { startMessagingService } from '../../../../app/messaging/service'

jest.mock('ffc-messaging')

const mocksubscribe = jest.fn()
MessageReceiver.prototype.subscribe = mocksubscribe

test('subscribes to messages', async () => {
  await startMessagingService()
  expect(mocksubscribe).toHaveBeenCalledTimes(1)
})
