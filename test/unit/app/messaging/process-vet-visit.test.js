const processVetVisit = require('../../../../app/messaging/process-vet-visit')
const vetVisitRepository = require('../../../../app/repositories/vet-visit-repository')
const sendMessage = require('../../../../app/messaging/send-message')

jest.mock('../../../../app/repositories/vet-visit-repository')
jest.mock('../../../../app/messaging/send-message')

describe(('Store data in database'), () => {
  const message = {
    body: {
      applicationReference: 'VV-1234-5678',
      sessionId: '8e5b5789-dad5-4f16-b4dc-bf6db90ce090',
      refeerence: 'VV-1234-5678'
    }
  }

  test('successfully fetched application', async () => {
    await processVetVisit(message)
    expect(vetVisitRepository.set).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledTimes(0)
  })
})
