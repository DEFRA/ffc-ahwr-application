const sendChangedApplicationEvent = require('../../../../../app/events')
const { sendMessage } = require('../../../../../app/messaging')
jest.mock('../../../../../app/messaging')

describe('Changed application record util test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('Should retrieve original and new state of a changed application record', async () => {
    const reference = 'VV-1234-1234'

    const originalState = {
      claimed: false,
      data: {
        key1: 'value1',
        key2: 'value2'
      }
    }

    const newState = {
      claimed: true,
      data: {
        key1: 'value3',
        key2: 'value4'
      }
    }

    sendChangedApplicationEvent(reference, originalState, newState)
    expect(sendMessage).toHaveBeenCalledTimes(1)
  })
})
