const processVetVisit = require('../../../../app/messaging/process-vet-visit')
const { vetVisitResponseMsgType, applicationResponseQueue } = require('../../../../app/config')
const states = require('../../../../app/messaging/states')

const { sendFarmerClaimInvitationEmail, sendFarmerVetRecordIneligibleEmail, sendVetConfirmationEmail } = require('../../../../app/lib/send-email')
jest.mock('../../../../app/lib/send-email')
const sendMessage = require('../../../../app/messaging/send-message')
jest.mock('../../../../app/messaging/send-message')
const vetVisitRepository = require('../../../../app/repositories/vet-visit-repository')
jest.mock('../../../../app/repositories/vet-visit-repository')
const applicationRepository = require('../../../../app/repositories/application-repository')
jest.mock('../../../../app/repositories/application-repository')

const error = new Error('Test exception')
error.response = { data: 'failed to send email' }

applicationRepository.get
  .mockResolvedValueOnce({
    reference: 'VV-1234-5678',
    data: { organisation: { email: 'test@farmer.email.com' } },
    vetVisit: null
  })
  .mockResolvedValueOnce({
    reference: 'VV-1234-5678',
    data: { organisation: { email: 'test@farmer.email.com' } },
    vetVisit: null
  })
  .mockResolvedValueOnce(null)
  .mockResolvedValueOnce({
    reference: 'VV-1234-5678',
    vetVisit: {
      dataValues: {
        reference: 'VV-1234-5678'
      }
    },
    claimed: true
  })
  .mockRejectedValueOnce(error)

describe(('Store data in database'), () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const message = {
    body: {
      signup: {
        applicationReference: 'VV-1234-5678',
        reference: 'VV-1234-5678'
      },
      eligibleSpecies: 'yes'
    },
    sessionId
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('successfully saves application and sends email when eligibleSpecies is \'yes\'', async () => {
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
    expect(sendFarmerClaimInvitationEmail).toHaveBeenCalledTimes(1)
    expect(sendVetConfirmationEmail).toHaveBeenCalledTimes(1)
  })

  test('successfully saves application and sends emails when eligibleSpecies is not \'yes\'', async () => {
    vetVisitRepository.set.mockReturnValue({
      dataValues: {
        reference: '23D13'
      }
    })

    const clone = JSON.parse(JSON.stringify(message))
    delete clone.body.eligibleSpecies
    console.log('mess', message, 'clone', clone)
    await processVetVisit(clone)

    expect(vetVisitRepository.set).toHaveBeenCalledTimes(1)
    expect(vetVisitRepository.set).toHaveBeenCalledWith(expect.objectContaining({
      applicationReference: 'VV-1234-5678',
      data: clone.body,
      createdBy: 'admin',
      createdAt: expect.any(Date)
    }))
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.submitted }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
    expect(sendFarmerClaimInvitationEmail).not.toHaveBeenCalled()
    expect(sendVetConfirmationEmail).toHaveBeenCalledTimes(1)
    expect(sendFarmerVetRecordIneligibleEmail).toHaveBeenCalledTimes(1)
  })

  test('Do not store application when no farmer application found', async () => {
    await processVetVisit(message)

    expect(vetVisitRepository.set).toHaveBeenCalledTimes(0)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.notFound }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
    expect(sendFarmerClaimInvitationEmail).toHaveBeenCalledTimes(0)
    expect(sendVetConfirmationEmail).toHaveBeenCalledTimes(0)
  })

  test('Do not store application if already claimed', async () => {
    await processVetVisit(message)

    expect(vetVisitRepository.set).toHaveBeenCalledTimes(0)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.alreadyClaimed }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
    expect(sendFarmerClaimInvitationEmail).toHaveBeenCalledTimes(0)
    expect(sendVetConfirmationEmail).toHaveBeenCalledTimes(0)
  })

  test('Sends failed state on error', async () => {
    await processVetVisit(message)

    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: states.failed }, vetVisitResponseMsgType, applicationResponseQueue, { sessionId })
  })
})
