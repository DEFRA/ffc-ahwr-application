import { REDACT_PII_PROGRESS_STATUS } from 'ffc-ahwr-common-library'
import { redactPII as redactDocumentGeneratorPII } from '../../redact-pii/redact-pii-document-generator.js'
import { redactPII as redactSFDMessagingProxyPII } from '../../redact-pii/redact-pii-sfd-messaging-proxy.js'
import { redactPII as redactApplicationStorageAccountTablesPII } from '../../redact-pii/redact-pii-application-storage-account-tables.js'
import { redactPII as redactApplicationDatabasePII } from '../../redact-pii/redact-pii-application-database.js'
import { updateApplicationRedactRecords } from '../../redact-pii/update-application-redact-records.js'
import { create as createRedactPIIFlag } from '../../redact-pii/create-redact-pii-flag.js'
import { getApplicationsToRedact } from '../../redact-pii/get-applications-to-redact.js'

const { DOCUMENT_GENERATOR_REDACTED, SFD_MESSAGE_PROXY_REDACTED, APPLICATION_STORAGE_REDACTED, APPLICATION_DATABASE_REDACTED, APPLICATION_REDACT_FLAG_ADDED } = REDACT_PII_PROGRESS_STATUS

export const processRedactPiiRequest = async (message, logger) => {
  const redactRequestedDate = message.body.requestedDate
  logger.setBindings({ redactRequestedDate })

  const { applicationsToRedact, status } = await getApplicationsToRedact(redactRequestedDate)

  if (applicationsToRedact.length === 0) {
    logger.info('No new applications to redact for this date')
    return
  }

  logger.info(`Processing starting from status: ${status.join()}`)

  if (!status.includes(DOCUMENT_GENERATOR_REDACTED)) {
    await redactDocumentGeneratorPII(applicationsToRedact, [...status], logger)
    status.push(DOCUMENT_GENERATOR_REDACTED)
  }

  if (!status.includes(SFD_MESSAGE_PROXY_REDACTED)) {
    await redactSFDMessagingProxyPII(applicationsToRedact, [...status], logger)
    status.push(SFD_MESSAGE_PROXY_REDACTED)
  }

  if (!status.includes(APPLICATION_STORAGE_REDACTED)) {
    await redactApplicationStorageAccountTablesPII(applicationsToRedact, [...status], logger)
    status.push(APPLICATION_STORAGE_REDACTED)
  }

  if (!status.includes(APPLICATION_DATABASE_REDACTED)) {
    await redactApplicationDatabasePII(applicationsToRedact, [...status], logger)
    status.push(APPLICATION_DATABASE_REDACTED)
  }

  if (!status.includes(APPLICATION_REDACT_FLAG_ADDED)) {
    await createRedactPIIFlag(applicationsToRedact, [...status], logger)
    status.push(APPLICATION_REDACT_FLAG_ADDED)
  }

  await updateApplicationRedactRecords(applicationsToRedact, false, [...status], 'Y')
  logger.info('Successfully processed redact PII request')
}
