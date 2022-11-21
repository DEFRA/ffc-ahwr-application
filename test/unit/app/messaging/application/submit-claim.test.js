const submitClaim = require('../../../../../app/messaging/application/submit-claim')
const { submitClaimResponseMsgType, applicationResponseQueue, submitPaymentRequestMsgType, submitRequestQueue } = require('../../../../../app/config')
const { alreadyClaimed, failed, error, notFound, success } = require('../../../../../app/messaging/application/states')

jest.mock('../../../../../app/repositories/application-repository')
const applicationRepository = require('../../../../../app/repositories/application-repository')
jest.mock('../../../../../app/messaging/send-message')
const sendMessage = require('../../../../../app/messaging/send-message')
jest.mock('../../../../../app/lib/send-email')
const { sendFarmerClaimConfirmationEmail } = require('../../../../../app/lib/send-email')

describe(('Submit claim tests'), () => {
  const reference = 'AHWR-1234-5678'
  const sessionId = '8e5b5789-dad5-4f16-b4dc-bf6db90ce090'
  const message = { body: { reference }, sessionId }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test.each([
    { desc: 'unclaimed application successfully updated returns success state', updateRes: [1], state: success, count: 13, statusId: 9 },
    { desc: 'unclaimed application compliance check successfully updated returns success state', updateRes: [1], state: success, count: 15, statusId: 5 },
    { desc: 'unclaimed application unsuccessfully updated returns failed state', updateRes: [0], state: failed, count: 3, statusId: 9 }
  ])('$desc', async ({ updateRes, state, count, statusId }) => {
    const email = 'an@email.com'
    const sbi = '444444444'
    const whichReview = 'beef'
    const applicationMock = { dataValues: { reference: 'AHWR-1234-5678', data: { whichReview, organisation: { email, sbi } } } }
    applicationRepository.get.mockResolvedValueOnce(applicationMock)
    applicationRepository.getApplicationsCount.mockResolvedValueOnce(count)
    applicationRepository.updateByReference.mockResolvedValueOnce(updateRes)

    await submitClaim(message)

    expect(applicationRepository.get).toHaveBeenCalledTimes(1)
    expect(applicationRepository.getApplicationsCount).toHaveBeenCalledTimes(1)
    expect(applicationRepository.get).toHaveBeenCalledWith(reference)
    expect(applicationRepository.updateByReference).toHaveBeenCalledTimes(1)
    expect(applicationRepository.updateByReference).toHaveBeenCalledWith({ reference, claimed: true, statusId, updatedBy: 'admin' })
    expect(sendMessage).toHaveBeenCalledWith({ state }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
    if (state === success && statusId === 9) {
      expect(sendMessage).toHaveBeenCalledTimes(2)
      expect(sendFarmerClaimConfirmationEmail).toHaveBeenCalledTimes(1)
      expect(sendFarmerClaimConfirmationEmail).toHaveBeenCalledWith(email, reference)
      expect(sendMessage).toHaveBeenCalledWith({ reference, sbi, whichReview }, submitPaymentRequestMsgType, submitRequestQueue, { sessionId })
    } else if (state === success && statusId === 5) {
      expect(sendMessage).toHaveBeenCalledTimes(1)
      expect(sendFarmerClaimConfirmationEmail).toHaveBeenCalledTimes(1)
    } else {
      expect(sendMessage).toHaveBeenCalledTimes(1)
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

  test('submit claim message validation failed', async () => {
    message.body.test = 'test'
    await submitClaim(message)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(sendMessage).toHaveBeenCalledWith({ state: error }, submitClaimResponseMsgType, applicationResponseQueue, { sessionId })
  })
})
