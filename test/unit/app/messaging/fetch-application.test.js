const fetchApplication = require('../../../../app/messaging/fetch-application')
const { fetchApplicationResponseMsgType, applicationResponseQueue } = require('../../../../app/config')
const states = require('../../../../app/messaging/states')

jest.mock('../../../../app/repositories/application-repository')
const applicationRepository = require('../../../../app/repositories/application-repository')
jest.mock('../../../../app/messaging/send-message')
const sendMessage = require('../../../../app/messaging/send-message')

describe(('Fetch application tests'), () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const message = {
    body: {
      applicationReference: 'VV-1234-5678'
    },
    sessionId
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('successfully fetched application', async () => {
    const application = {
      dataValues: {
        reference: 'VV-1234-5678',
        vetVisit: null
      }
    }
    applicationRepository.get.mockResolvedValueOnce(application)

    await fetchApplication(message)

    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(message.body.applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.notSubmitted, ...application.dataValues }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('no application found', async () => {
    applicationRepository.get.mockResolvedValueOnce({ dataValues: null })

    await fetchApplication(message)

    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(message.body.applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.notExist }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('already submitted application', async () => {
    const application = {
      dataValues: {
        reference: 'VV-1234-5678',
        vetVisit: {
          dataValues: {
            reference: 'VV-1234-5678'
          }
        }
      }
    }
    applicationRepository.get.mockResolvedValue(application)

    await fetchApplication(message)

    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(message.body.applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.alreadySubmitted, ...application.dataValues }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('error handling', async () => {
    applicationRepository.get.mockRejectedValue(new Error('bust'))

    await fetchApplication(message)

    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(message.body.applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.failed }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
  })
})
