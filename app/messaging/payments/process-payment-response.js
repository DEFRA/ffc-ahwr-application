const { updateByReference } = require('../../repositories/payment-repository')
const applicationRepository = require('../../repositories/application-repository')
const util = require('util')

const processPaymentResponse = async (message, receiver) => {
  try {
    const messageBody = message.body
    const paymentRequest = messageBody.paymentRequest
    const agreementNumber = paymentRequest?.agreementNumber
    const status = messageBody?.accepted ? 'success' : failedPaymentRequest(messageBody)
    if (paymentRequest && agreementNumber) {
      console.log('received process payments response', agreementNumber, status)
      if (paymentRequest?.value) {
        paymentRequest.value = paymentRequest.value / 100
      }
      if (paymentRequest?.invoiceLines?.length > 0 && paymentRequest?.invoiceLines[0]?.value) {
        paymentRequest.invoiceLines[0].value = paymentRequest.invoiceLines[0].value / 100
      }
      await updateByReference(agreementNumber, status, paymentRequest)
      await applicationRepository.updateByReference({
        reference: agreementNumber,
        statusId: 6, // use status id 6 for accepted
        updatedBy: 'admin'
      })
      await receiver.completeMessage(message)
    } else {
      console.error('Received process payments response with no payment request and agreement number', util.inspect(message.body, false, null, true))
      await receiver.deadLetterMessage(message)
    }
  } catch (err) {
    await receiver.deadLetterMessage(message)
    console.error('Unable to process payment request:', err)
  }
}

function failedPaymentRequest (messageBody) {
  console.error('Failed payment request', util.inspect(messageBody, false, null, true))
  return 'failed'
}

module.exports = processPaymentResponse
