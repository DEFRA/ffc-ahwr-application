const processVetVisit = require('../../../../app/messaging/process-vet-visit')
const vetVisitRepository = require('../../../../app/repositories/vet-visit-repository')
const sendMessage = require('../../../../app/messaging/send-message')
const sendEmail = require('../../../../app/lib/send-email')
const applicationRepository = require('../../../../app/repositories/application-repository')
const { vetVisitResponseMsgType, applicationResponseQueue } = require('../../../../app/config')

jest.mock('../../../../app/messaging/send-message')
jest.mock('../../../../app/repositories/vet-visit-repository')
jest.mock('../../../../app/repositories/application-repository')

sendEmail.sendFarmerClaimInvitationEmail = jest.fn().mockResolvedValue(true)
sendEmail.sendVetConfirmationEmail = jest.fn().mockResolvedValue(true)

const error = new Error('Test exception')
error.response = { data: 'failed to send email' }

applicationRepository.get.mockResolvedValueOnce({
  reference: 'VV-1234-5678',
  data: JSON.stringify({ email: 'test@farmer.email.com' }),
  vetVisit: null
}).mockRejectedValueOnce({
  reference: 'VV-1234-5678',
  vetVisit: {
    dataValues: {
      reference: 'VV-1234-5678'
    }
  }
}).mockRejectedValueOnce(error)

describe(('Store data in database'), () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })
  const message = {
    body: {
      signup: {
        applicationReference: 'VV-1234-5678',
        reference: 'VV-1234-5678'
      },
      sessionId: '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
    }
  }

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
      data: expect.any(String),
      createdBy: 'admin',
      createdAt: expect.any(Date)
    }))
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: 'submitted' }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId: message.body.sessionId })
    expect(sendEmail.sendFarmerClaimInvitationEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail.sendVetConfirmationEmail).toHaveBeenCalledTimes(1)
  })

  test('Do not store application if already submitted', async () => {
    await processVetVisit(message)
    expect(vetVisitRepository.set).toHaveBeenCalledTimes(0)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: 'failed' }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId: message.body.sessionId })
    expect(sendEmail.sendFarmerClaimInvitationEmail).toHaveBeenCalledTimes(0)
    expect(sendEmail.sendVetConfirmationEmail).toHaveBeenCalledTimes(0)
  })

  test('Sends failed state on error', async () => {
    await processVetVisit(message)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: 'failed' }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId: message.body.sessionId })
  })
})
