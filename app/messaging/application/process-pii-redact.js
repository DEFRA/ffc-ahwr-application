import wreck from "@hapi/wreck";
import { config } from "../../config/index.js"
import { reference } from "../../../test/scripts/lib/reference.mjs";

const { documentGeneratorApiUri, sfdMessagingProxyApiUri } = config;

export const processPiiRedactRequest = async (message, logger) => {
  logger.info(`Processing redact PII request, date: ${message.body.requestDate}`)
  try {
    const agreementsToRedact = getAgreementsToRedactWithRedactID() 

    callDocumentGeneratorRedactPII(agreementsToRedact, logger)
    callSfdMessagingProxyRedactPII(agreementsToRedact, logger)

    applicationStorageAccountTablesRedactPII(agreementsToRedact, logger)
    applicationDatabaseRedactPII(agreementsToRedact, logger)

    logger.info('Successfully processed redact PII request')
  } catch (error) {
    logger.error(`Failed to process redact PII request: ${error.message}`)
  }
}

const getAgreementsToRedactWithRedactID = () => {
  // TODO IMPL
  const agreementsWithNoPayment = [{ reference: 'FAKE-REF-1', sbi: 'FAKE-SBI-1', redactID: 'FAKE-REDACT-ID-1'}]
  // TODO IMPL 1070
  const agreementsWithRejectedPayment = []
  // TODO IMPL 1068
  const agreementsWithPayment = []

  return [...agreementsWithNoPayment, ...agreementsWithRejectedPayment, ...agreementsWithPayment]
}

const callDocumentGeneratorRedactPII = async (agreementsToRedact, logger) => {
  const endpoint = `${documentGeneratorApiUri}/redact/pii`;
  try {
    await wreck.post(endpoint, { json: true, payload: { agreementsToRedact } });
  } catch (err) {
    logger.setBindings({ err, endpoint });
    throw err;
  }
}

const callSfdMessagingProxyRedactPII = async (agreementsToRedact, logger) => {
  const endpoint = `${sfdMessagingProxyApiUri}/redact/pii`;
  try {
    await wreck.post(endpoint, { json: true, payload: { agreementsToRedact } });
  } catch (err) {
    logger.setBindings({ err, endpoint });
    throw err;
  }
}

const applicationStorageAccountTablesRedactPII = (agreementsToRedact, logger) => {
  try {
    // TODO Redact PII all app SA tables.. events, appstatus, monitoring, elig
    logger.info(`applicatioStorageAccountTablesRedactPI with: ${agreementsToRedact}`);
  } catch (err) {
    logger.setBindings({ err });
    throw err;
  }
}

const applicationDatabaseRedactPII = (agreementsToRedact, logger) => {
  try {
    // TODO Redact PII all app db tables.. application, claim, claim_update_history, contact_history
    // NOTE wrap app and claim redact in transaction
    logger.info(`applicationDatabaseRedactPII with: ${agreementsToRedact}`);
  } catch (err) {
    logger.setBindings({ err });
    throw err;
  }
}
