const submitClaim = require('../../../../app/messaging/submit-claim')
const { submitClaimResponseMsgType, applicationResponseQueue } = require('../../../../app/config')
const { alreadyClaimed, failed, error, notFound, success } = require('../../../../app/messaging/states')

jest.mock('../../../../app/repositories/application-repository')
const applicationRepository = require('../../../../app/repositories/application-repository')
jest.mock('../../../../app/messaging/send-message')
const sendMessage = require('../../../../app/messaging/send-message')
jest.mock('../../../../app/lib/send-email')
const { sendFarmerClaimConfirmationEmail } = require('../../../../app/lib/send-email')

describe(('Submit claim tests'), () => {
  const reference = 'VV-1234-5678'
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const message = { body: { reference }, sessionId }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test.each([
    { desc: 'unclaimed application successfully updated returns success state', updateRes: [1], state: success },
    { desc: 'unclaimed application unsuccessfully updated returns failed state', updateRes: [0], state: failed }
  ])('$desc', async ({ updateRes, state }) => {
    const email = 'an@email.com'
    const applicationMock = { dataValues: { reference: 'VV-1234-5678', data: { organisation: { email } } } }
    applicationRepository.get.mockResolvedValueOnce(applicationMock)
    applicationRepository.updateByReference.mockResolvedValueOnce(updateRes)

    await submitClaim(message)

    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(reference)
    expect(applicationRepository.updateByReference).toHaveBeenCalledTimes(1)
    expect(applicationRepository.updateByReference).toHaveBeenCalledWith({ reference, claimed: true, updatedBy: 'admin' })
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ state }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
    if (state === success) {
      expect(sendFarmerClaimConfirmationEmail).toHaveBeenCalledTimes(1)
      expect(sendFarmerClaimConfirmationEmail).toHaveBeenCalledWith(email, reference)
    } else {
      expect(sendFarmerClaimConfirmationEmail).toHaveBeenCalledTimes(0)
    }
  })

  test.each([
    { desc: 'no application exists returns notFound state', applicationMock: null, state: notFound },
    { desc: 'application already claimed returns alreadyClaimed state', applicationMock: { claimed: true }, state: alreadyClaimed }
  ])('$desc', async ({ applicationMock, state }) => {
    applicationRepository.get.mockResolvedValueOnce({ dataValues: applicationMock })

    await submitClaim(message)

    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(reference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ state }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })

  test('error occurring return error state', async () => {
    applicationRepository.get.mockRejectedValue(new Error('bust'))

    await submitClaim(message)

    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(reference)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ state: error }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })
})
