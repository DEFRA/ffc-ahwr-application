const processApplication = require('../../../../app/messaging/process-application')
const { applicationResponseMsgType, applicationResponseQueue } = require('../../../../app/config')
const states = require('../../../../app/messaging/states')

const { sendFarmerConfirmationEmail } = require('../../../../app/lib/send-email')
jest.mock('../../../../app/lib/send-email')
const sendMessage = require('../../../../app/messaging/send-message')
jest.mock('../../../../app/messaging/send-message')
const applicationRepository = require('../../../../app/repositories/application-repository')
jest.mock('../../../../app/repositories/application-repository')

describe(('Store application in database'), () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const email = 'email@domain.com'
  const name = 'name-on-org'
  const message = {
    body: {
      organisation: {
        email,
        name
      }
    },
    sessionId
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  const reference = '23D13'
  test('successfully submits application', async () => {
    applicationRepository.set.mockResolvedValue({
      dataValues: { reference }
    })

    await processApplication(message)

    expect(applicationRepository.set).toHaveBeenCalledTimes(1)
    expect(applicationRepository.set).toHaveBeenCalledWith(expect.objectContaining({
      reference: '',
      data: message.body,
      createdBy: 'admin',
      createdAt: expect.any(Date)
    }))
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.submitted, applicationReference: reference }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
    expect(sendFarmerConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendFarmerConfirmationEmail).toHaveBeenCalledWith(email, name, reference)
  })

  test('Sends failed state on db error and no email is sent', async () => {
    applicationRepository.set.mockResolvedValue(new Error('bust'))

    await processApplication(message)

    expect(sendFarmerConfirmationEmail).not.toHaveBeenCalled()
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.failed }, applicationResponseMsgType, applicationResponseQueue, { sessionId })
  })
})
