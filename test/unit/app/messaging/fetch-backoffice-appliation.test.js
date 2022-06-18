const fetchBackOfficeApplication = require('../../../../app/messaging/back-office/fetch-backoffice-application')
const { getBackOfficeApplicationResponseMsgType, backOfficeResponseQueue } = require('../../../../app/config')
const states = require('../../../../app/messaging/states')

jest.mock('../../../../app/lib/send-email')
const sendMessage = require('../../../../app/messaging/send-message')
jest.mock('../../../../app/messaging/send-message')
const applicationRepository = require('../../../../app/repositories/application-repository')
jest.mock('../../../../app/repositories/application-repository')

describe('process backOffice fetch application message', () => {
  const reference = '23D13'
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const email = 'email@domain.com'
  const name = 'name-on-org'
  const message = {
    body: {
      organisation: {
        email,
        name
      },
      reference
    },
    sessionId
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('successfully process backOffice get application request', async () => {
    applicationRepository.get.mockResolvedValue({
      dataValues: {
        reference,
        data: message.body,
        createdBy: 'admin',
        createdAt: new Date()
      }
    })

    await fetchBackOfficeApplication(message)

    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(reference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    // expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.submitted, backOfficeReference: reference }, getBackOfficeApplicationResponseMsgType, backOfficeResponseQueue, { sessionId })
  })

  test('Sends failed state on db error', async () => {
    applicationRepository.get.mockResolvedValue(new Error('bust'))

    await fetchBackOfficeApplication(message)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.notFound }, getBackOfficeApplicationResponseMsgType, backOfficeResponseQueue, { sessionId })
  })
})
