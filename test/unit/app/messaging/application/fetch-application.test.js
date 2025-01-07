import { fetchApplication } from '../../../../../app/messaging/application/fetch-application'
import { config } from '../../../../../app/config'
import { messagingStates } from '../../../../../app/constants'
import { getApplication } from '../../../../../app/repositories/application-repository'
import { sendMessage } from '../../../../../app/messaging/send-message'

jest.mock('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/messaging/send-message')

const { fetchApplicationResponseMsgType, applicationResponseQueue } = config

describe(('Fetch application tests'), () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const message = {
    body: {
      applicationReference: 'AHWR-1234-5678'
    },
    sessionId
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('successfully fetched application', async () => {
    const application = {
      dataValues: {
        reference: 'AHWR-1234-5678',
        vetVisit: null
      }
    }
    getApplication.mockResolvedValueOnce(application)

    await fetchApplication(message)

    expect(getApplication).toHaveBeenCalledTimes(1)
    expect(getApplication).toHaveBeenCalledWith(message.body.applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: messagingStates.notSubmitted, ...application.dataValues }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('no application found', async () => {
    getApplication.mockResolvedValueOnce({ dataValues: null })

    await fetchApplication(message)

    expect(getApplication).toHaveBeenCalledTimes(1)
    expect(getApplication).toHaveBeenCalledWith(message.body.applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: messagingStates.notFound }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('already submitted application', async () => {
    const application = {
      dataValues: {
        reference: 'AHWR-1234-5678',
        vetVisit: {
          dataValues: {
            reference: 'AHWR-1234-5678'
          }
        }
      }
    }
    getApplication.mockResolvedValue(application)

    await fetchApplication(message)

    expect(getApplication).toHaveBeenCalledTimes(1)
    expect(getApplication).toHaveBeenCalledWith(message.body.applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: messagingStates.alreadySubmitted, ...application.dataValues }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('error handling', async () => {
    getApplication.mockRejectedValue(new Error('bust'))

    await fetchApplication(message)

    expect(getApplication).toHaveBeenCalledTimes(1)
    expect(getApplication).toHaveBeenCalledWith(message.body.applicationReference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: messagingStates.failed }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('Fetch application message validation failed', async () => {
    message.body.test = 'test'
    await fetchApplication(message)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: messagingStates.failed }, fetchApplicationResponseMsgType, applicationResponseQueue, { sessionId })
  })
})
