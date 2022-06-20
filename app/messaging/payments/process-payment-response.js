const util = require('util')
const { updateByReference } = require('../../repositories/payment-repository')

const processPaymentResponse = async (message, receiver) => {
  try {
    const messageBody = message.body
    const paymentRequest = messageBody.paymentRequest
    const agreementNumber = paymentRequest?.agreementNumber
    const status = messageBody?.accepted ? 'success' : failedPaymentRequest(messageBody)
    if (paymentRequest && agreementNumber) {
      console.log('received process payments response', agreementNumber, status)
      await updateByReference(agreementNumber, status, paymentRequest)
      await receiver.completeMessage(message)
    } else {
      console.error('received process payments response with no agreement number', util.inspect(message.body, false, null, true))
      await receiver.deadLetterMessage(message)
    }
  } catch (err) {
    await receiver.deadLetterMessage(message)
    console.error('Unable to process payment request:', err)
  }
}

const failedPaymentRequest = (messageBody) => {
  console.error('Failed payment request', util.inspect(messageBody, false, null, true))
  return 'failed'
}

module.exports = processPaymentResponse
