const util = require('util')
const { updateByReference } = require('../../repositories/payment-repository')

const processPaymentResponse = async (message, receiver) => {
  try {
    const { agreementNumber } = message.body
    console.log('received process payments response', util.inspect(agreementNumber, false, null, true))
    await updateByReference(agreementNumber, 'success')
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to process payment request:', err)
  }
}

module.exports = processPaymentResponse
