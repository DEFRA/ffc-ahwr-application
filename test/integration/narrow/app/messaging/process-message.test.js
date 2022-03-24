describe('Process Message test', () => {
  test('Process Message returns Function', () => {
    const processApplicationMessage = require('../../../../../app/messaging/process-message')
    expect(processApplicationMessage).toBeDefined()
  })
  test('Call processApplicationMessage success', () => {
    jest.mock('../../../../../app/repositories/application-repository')
    jest.mock('../../../../../app/messaging')
    jest.mock('../../../../../app/config')
    const processApplicationMessage = require('../../../../../app/messaging/process-message')
    const completeMessage = jest.fn(async (message) => {
      return null
    })
    processApplicationMessage({ body: { applicationId: 'message' } }, { completeMessage })
    expect(completeMessage).toHaveBeenCalledTimes(0)
  })
})
