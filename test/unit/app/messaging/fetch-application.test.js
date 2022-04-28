const fetchApplication = require('../../../../app/messaging/fetch-application')
const applicationRepository = require('../../../../app/repositories/application-repository')
const sendMessage = require('../../../../app/messaging/send-message')
const { fetchApplicationResponseMsgType, applicationResponseQueue } = require('../../../../app/config')

jest.mock('../../../../app/repositories/application-repository')
jest.mock('../../../../app/messaging/send-message')

const application = {
  reference: 'VV-1234-5678',
  vetVisit: null
}

applicationRepository.get.mockResolvedValueOnce(application).mockResolvedValueOnce(null).mockResolvedValue({
  reference: 'VV-1234-5678',
  vetVisit: {
    dataValues: {
      reference: 'VV-1234-5678'
    }
  }
})

describe(('Fetch application tests'), () => {
  const message = {
    body: {
      applicationReference: 'VV-1234-5678',
      sessionId: '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
    }
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('successfully fetched application', async () => {
    await fetchApplication(message)
    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(message.body.applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: 'not_submitted' }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId: message.body.sessionId })
  })

  test('no application found', async () => {
    await fetchApplication(message)
    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(message.body.applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: 'not_exist' }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId: message.body.sessionId })
  })

  test('already submitted application', async () => {
    await fetchApplication(message)
    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(message.body.applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: 'already_submitted' }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId: message.body.sessionId })
  })
})
