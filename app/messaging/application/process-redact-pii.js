import wreck from '@hapi/wreck'
import { config } from '../../config/index.js'

const { documentGeneratorApiUri, sfdMessagingProxyApiUri } = config

export const processRedactPiiRequest = async (message, logger) => {
  logger.setBindings({ redactPiiRequested: message.body.requestDate })

  const agreementsToRedact = getAgreementsToRedactWithRedactID()

  await callDocumentGeneratorRedactPII(agreementsToRedact, logger)
  await callSfdMessagingProxyRedactPII(agreementsToRedact, logger)

  await applicationStorageAccountTablesRedactPII(agreementsToRedact, logger)
  await applicationDatabaseRedactPII(agreementsToRedact, logger)

  logger.info('Successfully processed redact PII request')
}

const getAgreementsToRedactWithRedactID = () => {
  // TODO IMPL
  const agreementsWithNoPayment = [{ reference: 'FAKE-REF-1', sbi: 'FAKE-SBI-1', redactID: 'FAKE-REDACT-ID-1' }]
  // TODO IMPL 1070
  const agreementsWithRejectedPayment = []
  // TODO IMPL 1068
  const agreementsWithPayment = []

  return [...agreementsWithNoPayment, ...agreementsWithRejectedPayment, ...agreementsWithPayment]
}

const callDocumentGeneratorRedactPII = async (agreementsToRedact, logger) => {
  const endpoint = `${documentGeneratorApiUri}/redact/pii`
  try {
    await wreck.post(endpoint, { json: true, payload: { agreementsToRedact } })
  } catch (err) {
    logger.setBindings({ err, endpoint })
    throw err
  }
}

const callSfdMessagingProxyRedactPII = async (agreementsToRedact, logger) => {
  const endpoint = `${sfdMessagingProxyApiUri}/redact/pii`
  try {
    await wreck.post(endpoint, { json: true, payload: { agreementsToRedact } })
  } catch (err) {
    logger.setBindings({ err, endpoint })
    throw err
  }
}

const applicationStorageAccountTablesRedactPII = (agreementsToRedact, logger) => {
  try {
    // TODO Redact PII all app SA tables.. events, appstatus, monitoring, elig
    logger.info(`applicatioStorageAccountTablesRedactPII with: ${JSON.stringify(agreementsToRedact)}`)
  } catch (err) {
    logger.setBindings({ err })
    throw err
  }
}

const applicationDatabaseRedactPII = (agreementsToRedact, logger) => {
  try {
    // TODO Redact PII all app db tables.. application, claim, claim_update_history, contact_history
    // NOTE wrap app and claim redact in transaction
    logger.info(`applicationDatabaseRedactPII with: ${JSON.stringify(agreementsToRedact)}`)
  } catch (err) {
    logger.setBindings({ err })
    throw err
  }
}
