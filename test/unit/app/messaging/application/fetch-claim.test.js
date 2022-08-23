const fetchClaim = require('../../../../../app/messaging/application/fetch-claim')
const { fetchClaimResponseMsgType, applicationResponseQueue } = require('../../../../../app/config')
const { failed, notFound } = require('../../../../../app/messaging/application/states')

jest.mock('../../../../../app/repositories/application-repository')
const applicationRepository = require('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/messaging/send-message')
const sendMessage = require('../../../../../app/messaging/send-message')

describe(('Fetch claim tests'), () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const message = { body: { email: 'an@email.com' }, sessionId }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('successfully fetched claim', async () => {
    const claim = {
      dataValues: {
        reference: 'VV-1234-5678'
      }
    }
    applicationRepository.getByEmail.mockResolvedValueOnce(claim)

    await fetchClaim(message)

    expect(applicationRepository.getByEmail).toHaveBeenCalledTimes(1)
    expect(applicationRepository.getByEmail).toHaveBeenCalledWith(message.body.email)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(claim.dataValues, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('no claim found', async () => {
    const claim = null
    applicationRepository.getByEmail.mockResolvedValueOnce({ dataValues: claim })

    await fetchClaim(message)

    expect(applicationRepository.getByEmail).toHaveBeenCalledTimes(1)
    expect(applicationRepository.getByEmail).toHaveBeenCalledWith(message.body.email)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: notFound, ...claim }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('error handling', async () => {
    applicationRepository.getByEmail.mockRejectedValue(new Error('bust'))

    await fetchClaim(message)

    expect(applicationRepository.getByEmail).toHaveBeenCalledTimes(1)
    expect(applicationRepository.getByEmail).toHaveBeenCalledWith(message.body.email)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: failed }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('Fetch claim message validation failed', async () => {
    message.body.test = 'test'
    await fetchClaim(message)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: failed }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })
})
