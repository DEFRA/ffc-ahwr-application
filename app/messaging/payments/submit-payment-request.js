const speciesData = require('./species')
const sendMessage = require('../send-message')
const { submitPaymentRequestMsgType, paymentRequestTopic } = require('../../config')
const { get, set } = require('../../repositories/payment-repository')

const buildPaymentRequest = (application) => {
  const agreementNumber = application.reference
  const sbi = application.data.organisation.sbi
  const marketingYear = new Date().getFullYear()
  const species = application.data.whichReview
  const standardCode = speciesData[species].code
  const value = speciesData[species].value

  return {
    sourceSystem: 'AHWR',
    sbi,
    marketingYear,
    paymentRequestNumber: 1,
    agreementNumber,
    value,
    invoiceLines: [{
      standardCode,
      description: 'G00 - Gross value of claim',
      value
    }]
  }
}

const submitPaymentRequest = async (application, sessionId) => {
  const { reference } = application

  const paymentExists = await checkIfPaymentExists(reference)

  if (!paymentExists) {
    const paymentRequest = buildPaymentRequest(application)
    await savePaymentRequest(reference, paymentRequest)
    await sendMessage(paymentRequest, submitPaymentRequestMsgType, paymentRequestTopic, { sessionId })
  } else {
    throw new Error(`Payment request already exists for reference ${reference}`)
  }
}

const savePaymentRequest = async (reference, paymentRequest) => {
  return set(reference, paymentRequest)
}

const checkIfPaymentExists = async (reference) => {
  return get(reference)
}

module.exports = submitPaymentRequest
