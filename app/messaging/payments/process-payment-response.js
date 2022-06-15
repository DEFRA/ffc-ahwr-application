const util = require('util')
const { updateByReference } = require('../../repositories/payment-repository')

const processPaymentResponse = async (message, receiver) => {
  try {
    const msgBody = message.body
    console.log('received process payments response', util.inspect(msgBody, false, null, true))
    await updateByReference(msgBody.agreementNumber, 'success')
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to process payment request:', err)
  }
}

module.exports = processPaymentResponse
