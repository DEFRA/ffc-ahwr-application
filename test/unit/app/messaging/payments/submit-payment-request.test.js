
const submitPaymentRequest = require('../../../../../app/messaging/payments/submit-payment-request')
jest.mock('../../../../../app/repositories/payment-repository')
const paymentRepository = require('../../../../../app/repositories/payment-repository')
jest.mock('../../../../../app/messaging/send-message')
const sendMessage = require('../../../../../app/messaging/send-message')

const reference = 'AA-123-456'

describe(('Submit payment request'), () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('Set creates record for payment and sends message', async () => {
    paymentRepository.get.mockResolvedValueOnce()
    await submitPaymentRequest(
      {
        reference,
        data: {
          organisation: {
            sbi: '123456789'
          },
          whichReview: 'beef'
        }
      },
      '123456789')
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(paymentRepository.set).toHaveBeenCalledTimes(1)
  })

  test('error thrown with payment request already existing', async () => {
    paymentRepository.get.mockResolvedValueOnce({ applicationReference: reference })
    await expect(submitPaymentRequest({ reference }, '123456789')).rejects.toEqual(new Error(`Payment request already exists for reference ${reference}`))
  })

  test('error thrown due to incorrect payment request schema', async () => {
    paymentRepository.get.mockResolvedValueOnce()
    await expect(submitPaymentRequest({ reference }, '123456789')).rejects.toEqual(new Error(`Payment request schema not valid for reference ${reference}`))
  })
})
