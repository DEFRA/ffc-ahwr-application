const processVetVisit = require('../../../../app/messaging/process-vet-visit')
const vetVisitRepository = require('../../../../app/repositories/vet-visit-repository')
const sendMessage = require('../../../../app/messaging/send-message')
const sendEmail = require('../../../../app/lib/send-email')
const applicationRepository = require('../../../../app/repositories/application-repository')
const { vetVisitResponseMsgType, applicationResponseQueue } = require('../../../../app/config')
const states = require('../../../../app/messaging/states')

jest.mock('../../../../app/messaging/send-message')
jest.mock('../../../../app/repositories/vet-visit-repository')
jest.mock('../../../../app/repositories/application-repository')

sendEmail.sendFarmerClaimInvitationEmail = jest.fn().mockResolvedValue(true)
sendEmail.sendVetConfirmationEmail = jest.fn().mockResolvedValue(true)

const error = new Error('Test exception')
error.response = { data: 'failed to send email' }

applicationRepository.get.mockResolvedValueOnce({
  reference: 'VV-1234-5678',
  data: { organisation: { email: 'test@farmer.email.com' } },
  vetVisit: null
}).mockResolvedValueOnce(null).mockResolvedValueOnce({
  reference: 'VV-1234-5678',
  vetVisit: {
    dataValues: {
      reference: 'VV-1234-5678'
    }
  }
}).mockRejectedValueOnce(error)

describe(('Store data in database'), () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const message = {
    body: {
      signup: {
        applicationReference: 'VV-1234-5678',
        reference: 'VV-1234-5678'
      }
    },
    sessionId
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('successfully submits application', async () => {
    vetVisitRepository.set.mockReturnValue({
      dataValues: {
        reference: '23D13'
      }
    })

    await processVetVisit(message)

    expect(vetVisitRepository.set).toHaveBeenCalledTimes(1)
    expect(vetVisitRepository.set).toHaveBeenCalledWith(expect.objectContaining({
      applicationReference: 'VV-1234-5678',
      data: message.body,
      createdBy: 'admin',
      createdAt: expect.any(Date)
    }))
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.submitted }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
    expect(sendEmail.sendFarmerClaimInvitationEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.sendVetConfirmationEmail).toHaveBeenCalledTimes(1)
  })

  test('Do not store application when no farmer application found', async () => {
    await processVetVisit(message)

    expect(vetVisitRepository.set).toHaveBeenCalledTimes(0)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.notExist }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
    expect(sendEmail.sendFarmerClaimInvitationEmail).toHaveBeenCalledTimes(0)
    expect(sendEmail.sendVetConfirmationEmail).toHaveBeenCalledTimes(0)
  })

  test('Do not store application if already submitted', async () => {
    await processVetVisit(message)

    expect(vetVisitRepository.set).toHaveBeenCalledTimes(0)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.alreadySubmitted }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
    expect(sendEmail.sendFarmerClaimInvitationEmail).toHaveBeenCalledTimes(0)
    expect(sendEmail.sendVetConfirmationEmail).toHaveBeenCalledTimes(0)
  })

  test('Sends failed state on error', async () => {
    await processVetVisit(message)

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.failed }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
  })
})
