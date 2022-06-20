const processPaymentResponse = require('../../../../../app/messaging/payments/process-payment-response')
jest.mock('../../../../../app/repositories/payment-repository')
const paymentRepository = require('../../../../../app/repositories/payment-repository')

describe(('Process payment response'), () => {
  const consoleError = jest.spyOn(console, 'error')

  const receiver = {
    completeMessage: jest.fn(),
    abandonMessage: jest.fn(),
    deadLetterMessage: jest.fn()
  }

  beforeEach(async () => {
    jest.clearAllMocks()
  })

  test('Sucessfully update the payment with success status', async () => {
    paymentRepository.updateByReference.mockResolvedValueOnce()
    await processPaymentResponse({
      body: {
        paymentRequest: {
          agreementNumber: 'AA-1234-567'
        },
        accepted: true
      }
    }
    , receiver)

    expect(paymentRepository.updateByReference).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
  })

  test('Update the payment with failed status', async () => {
    paymentRepository.updateByReference.mockResolvedValueOnce()
    await processPaymentResponse({
      body: {
        paymentRequest: {
          agreementNumber: 'AA-1234-567'
        },
        accepted: false
      }
    }
    , receiver)

    expect(paymentRepository.updateByReference).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledTimes(1)
  })

  test('console.error raised due to no agreement number within message', async () => {
    paymentRepository.updateByReference.mockResolvedValueOnce()
    await processPaymentResponse({}, receiver)

    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
  })

  test('console.error raised due to error thrown in updateByReference', async () => {
    paymentRepository.updateByReference.mockResolvedValueOnce(() => { throw new Error() })
    await processPaymentResponse({}, receiver)

    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
  })
})
