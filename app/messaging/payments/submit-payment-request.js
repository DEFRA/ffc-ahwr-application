const config = require('../../config')
const { description, paymentRequestNumber, sourceSystem } = require('../../constants/payment-request')
const { get, set } = require('../../repositories/payment-repository')
const sendMessage = require('../send-message')
const speciesData = require('./species')
const { submitPaymentRequestMsgType, paymentRequestTopic } = require('../../config')
const validatePaymentRequest = require('./payment-request-schema')

const buildPaymentRequest = (application) => {
  const agreementNumber = application?.reference
  const sbi = application?.data?.organisation?.sbi
  const marketingYear = new Date().getFullYear()
  const species = application?.data?.whichReview
  const standardCode = speciesData[species]?.code
  const value = speciesData[species]?.value

  return {
    sourceSystem,
    sbi,
    marketingYear,
    paymentRequestNumber,
    agreementNumber,
    value,
    invoiceLines: [{
      standardCode,
      description,
      value
    }]
  }
}

const submitPaymentRequest = async (application, sessionId) => {
  const { reference } = application

  const paymentExists = await checkIfPaymentExists(reference)

  if (!paymentExists) {
    const paymentRequest = buildPaymentRequest(application)
    if (validatePaymentRequest(paymentRequest)) {
      await savePaymentRequest(reference, paymentRequest)
      await sendPaymentRequest(paymentRequest, sessionId)
    } else {
      throw new Error(`Payment request schema not valid for reference ${reference}`)
    }
  } else {
    throw new Error(`Payment request already exists for reference ${reference}`)
  }
}

const sendPaymentRequest = async (paymentRequest, sessionId) => {
  if (config.sendPaymentRequest) {
    await sendMessage(paymentRequest, submitPaymentRequestMsgType, paymentRequestTopic, { sessionId })
  }
}

const savePaymentRequest = async (reference, paymentRequest) => {
  return set(reference, paymentRequest)
}

const checkIfPaymentExists = async (reference) => {
  return get(reference)
}

module.exports = submitPaymentRequest
