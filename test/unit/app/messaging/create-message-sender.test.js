const { createMessageSender, cachedSenders, closeAllConnections } = require('../../../../app/messaging/create-message-sender')

const MOCK_CLOSE_CONNECTION = jest.fn()

jest.mock('ffc-messaging', () => {
  const MockMessageSender = jest.fn().mockImplementation(() => ({
    closeConnection: MOCK_CLOSE_CONNECTION
  }))

  return {
    MessageSender: MockMessageSender
  }
})

describe('closeAllConnections', () => {
  beforeEach(() => {
    // Clear the cachedSenders object before each test
    Object.keys(cachedSenders).forEach((key) => delete cachedSenders[key])
  })

  test('should close all connections and clear cachedSenders', async () => {
    createMessageSender({
      address: 'abc'
    })
    createMessageSender({
      address: 'abcd'
    })
    expect(Object.keys(cachedSenders)).toHaveLength(2)
    createMessageSender({
      address: 'abcde'
    })
    expect(Object.keys(cachedSenders)).toHaveLength(3)
    createMessageSender({
      address: 'abcde'
    })
    expect(Object.keys(cachedSenders)).toHaveLength(3)

    await closeAllConnections()

    expect(MOCK_CLOSE_CONNECTION).toHaveBeenCalledTimes(3)
    expect(Object.keys(cachedSenders)).toHaveLength(0)
  })

  test('should do nothing when cachedSenders is empty', async () => {
    // Call closeAllConnections when cachedSenders is empty
    await closeAllConnections()

    // Expect no errors to be thrown
    // Expect cachedSenders to remain empty
    expect(Object.keys(cachedSenders)).toHaveLength(0)
  })
})
