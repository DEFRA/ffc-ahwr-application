const fetchApplication = require('../../../../app/messaging/fetch-application')
const applicationRepository = require('../../../../app/repositories/application-repository')
const sendMessage = require('../../../../app/messaging/send-message')

jest.mock('../../../../app/repositories/application-repository')
jest.mock('../../../../app/messaging/send-message')

describe(('Fetch application tests'), () => {
  const message = {
    body: {
      applicationReference: 'VV-1234-5678',
      sessionId: '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
    }
  }

  test('successfully fetched application', async () => {
    await fetchApplication(message)
    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(message.body.applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
  })
})
