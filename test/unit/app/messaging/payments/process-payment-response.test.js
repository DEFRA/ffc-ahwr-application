const util = require('util')
const processPaymentResponse = require('../../../../../app/messaging/payments/process-payment-response')
jest.mock('../../../../../app/repositories/payment-repository')
const paymentRepository = require('../../../../../app/repositories/payment-repository')

describe(('Process payment response'), () => {
  const consoleError = jest.spyOn(console, 'error')
  const agreementNumber = 'AA-1234-567'

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
          agreementNumber
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
          agreementNumber
        },
        accepted: false
      }
    }
    , receiver)

    expect(paymentRepository.updateByReference).toHaveBeenCalledTimes(1)
    expect(receiver.completeMessage).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenCalledWith(
      'Failed payment request',
      util.inspect(
        {
          paymentRequest: {
            agreementNumber
          },
          accepted: false
        },
        false, null, true)
    )
  })

  test('console.error raised due to no agreement number within message', async () => {
    paymentRepository.updateByReference.mockResolvedValueOnce()
    await processPaymentResponse({
      body: {
        paymentRequest: {},
        accepted: false
      }
    }, receiver)
    expect(consoleError).toHaveBeenCalledWith(
      'Received process payments response with no payment request and agreement number',
      util.inspect(
        {
          paymentRequest: {},
          accepted: false
        },
        false, null, true)
    )
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
  })

  test('console.error raised due to error thrown in updateByReference', async () => {
    paymentRepository.updateByReference.mockResolvedValueOnce(() => { throw new Error() })
    await processPaymentResponse({}, receiver)
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(receiver.deadLetterMessage).toHaveBeenCalledTimes(1)
  })
})
