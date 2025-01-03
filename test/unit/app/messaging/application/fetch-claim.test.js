import { fetchClaim } from '../../../../../app/messaging/application/fetch-claim'
import { config } from '../../../../../app/config'
import { messagingStates } from '../../../../../app/constants'
import { getByEmail } from '../../../../../app/repositories/application-repository'
import { sendMessage } from '../../../../../app/messaging/send-message'

const { fetchClaimResponseMsgType, applicationResponseQueue } = config

jest.mock('../../../../../app/repositories/application-repository')

jest.mock('../../../../../app/messaging/send-message')

describe(('Fetch claim tests'), () => {
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const message = { body: { email: 'an@email.com' }, sessionId }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('successfully fetched claim', async () => {
    const claim = {
      dataValues: {
        reference: 'AHWR-1234-5678'
      }
    }
    getByEmail.mockResolvedValueOnce(claim)

    await fetchClaim(message)

    expect(getByEmail).toHaveBeenCalledTimes(1)
    expect(getByEmail).toHaveBeenCalledWith(message.body.email)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith(claim.dataValues, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('no claim found', async () => {
    const claim = null
    getByEmail.mockResolvedValueOnce({ dataValues: claim })

    await fetchClaim(message)

    expect(getByEmail).toHaveBeenCalledTimes(1)
    expect(getByEmail).toHaveBeenCalledWith(message.body.email)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: messagingStates.notFound, ...claim }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('error handling', async () => {
    getByEmail.mockRejectedValue(new Error('bust'))

    await fetchClaim(message)

    expect(getByEmail).toHaveBeenCalledTimes(1)
    expect(getByEmail).toHaveBeenCalledWith(message.body.email)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: messagingStates.failed }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('Fetch claim message validation failed', async () => {
    message.body.test = 'test'
    await fetchClaim(message)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ applicationState: messagingStates.failed }, fetchClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })
})
