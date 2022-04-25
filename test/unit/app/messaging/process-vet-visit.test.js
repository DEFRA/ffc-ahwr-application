const processVetVisit = require('../../../../app/messaging/process-vet-visit')
const vetVisitRepository = require('../../../../app/repositories/vet-visit-repository')
const sendMessage = require('../../../../app/messaging/send-message')
const sendEmail = require('../../../../app/lib/send-email')

jest.mock('../../../../app/lib/send-email')
jest.mock('../../../../app/messaging/send-message')
jest.mock('../../../../app/repositories/vet-visit-repository')

describe(('Store data in database'), () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })
  const message = {
    body: {
      signup: {
        applicationReference: 'VV-1234-5678',
        rcvs: '13D2332',
        sessionId: '8e5b5789-dad5-4f16-b4dc-bf6db90ce090',
        reference: 'VV-1234-5678'
      }
    }
  }

  test('successfully submits application', async () => {
    vetVisitRepository.set.mockReturnValue({
      dataValues: {
        reference: '23D13'
      }
    })
    sendEmail.mockResolvedValue(true)
    await processVetVisit(message)
    expect(vetVisitRepository.set).toHaveBeenCalledTimes(1)
    expect(vetVisitRepository.set).toHaveBeenCalledWith(expect.objectContaining({
      reference: '',
      applicationReference: 'VV-1234-5678',
      rcvs: '13D2332',
      data: expect.any(String),
      createdBy: 'admin',
      createdAt: expect.any(Date)
    }))
    expect(sendMessage).toHaveBeenCalledTimes(1)
  })
})
