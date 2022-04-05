const mockSendMessage = jest.fn()
jest.mock('ffc-messaging', () => {
  return {
    MessageSender: jest.fn().mockImplementation(() => {
      return {
        sendMessage: mockSendMessage,
        closeConnection: jest.fn()
      }
    })
  }
})
describe('Send Message test', () => {
  test('Send Message returns Function', () => {
    const sendMessage = require('../../../../../app/messaging/send-message')
    expect(sendMessage).toBeDefined()
  })
  test('Call SendMessage success', () => {
    jest.mock('../../../../../app/messaging/create-message')
    const sendMessage = require('../../../../../app/messaging/send-message')
    sendMessage()
    expect(sendMessage).toBeDefined()
  })
})
