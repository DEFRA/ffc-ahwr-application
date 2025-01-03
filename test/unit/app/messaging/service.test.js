import { MessageReceiver } from 'ffc-messaging'
import { start } from '../../../../app/messaging/service'

jest.mock('ffc-messaging')

const mocksubscribe = jest.fn()
MessageReceiver.prototype.subscribe = mocksubscribe

test('subscribes to messages', async () => {
  await start()
  expect(mocksubscribe).toHaveBeenCalledTimes(1)
})
