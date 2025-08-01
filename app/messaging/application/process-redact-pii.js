import wreck from '@hapi/wreck'
import { config } from '../../config/index.js'
import { getApplicationsToRedactFor, createApplicationRedact, updateApplicationRedact } from '../../repositories/application-redact-repository.js'
import { getAgreementsToRedactWithNoPaymentOlderThanThreeYears, getAgreementsToRedactWithRejectedPaymentOlderThanThreeYears, getAgreementsToRedactWithPaymentOlderThanSevenYears, redactPII as redactApplicationPII } from '../../repositories/application-repository.js'
import { redactPII as redactClaimPII } from '../../repositories/claim-repository.js'
import { redactPII as redactContactHistoryPII } from '../../repositories/contact-history-repository.js'
import { redactPII as redactFlagPII } from '../../repositories/flag-repository.js'
import { redactPII as redactHerdPII } from '../../repositories/herd-repository.js'
import { redactPII as redactStatusPII } from '../../azure-storage/application-status-repository.js'
import { redactPII as redactIneligibilityPII } from '../../azure-storage/application-ineligibility-repository.js'
import { redactPII as redactApplicationEventPII } from '../../azure-storage/application-eventstore-repository.js'

const { documentGeneratorApiUri, sfdMessagingProxyApiUri } = config

export const processRedactPiiRequest = async (message, logger) => {
  logger.setBindings({ redactRequestedDate: message.body.requestedDate })

  const agreementsToRedact = await getAgreementsToRedact(message.body.requestedDate)
  if (agreementsToRedact.length === 0) {
    logger.info('No new agreements to redact for this date')
    return
  }

  await callDocumentGeneratorRedactPII(agreementsToRedact, logger)
  await callSfdMessagingProxyRedactPII(agreementsToRedact, logger)

  await applicationStorageAccountTablesRedactPII(agreementsToRedact, logger)
  await applicationDatabaseRedactPII(agreementsToRedact, logger)

  await updateAllAgreements(agreementsToRedact, false, 'documents,messages,storage-accounts,database-tables', 'Y')
  logger.info('Successfully processed redact PII request')
}

const getAgreementsToRedact = async (requestedDate) => {
  // get applications not yet queued for redaction and store in redact table
  const agreementsWithNoPayment = await getAgreementsToRedactWithNoPaymentOlderThanThreeYears()
  const agreementsWithRejectedPayment = await getAgreementsToRedactWithRejectedPaymentOlderThanThreeYears()
  const agreementsWithPayment = await getAgreementsToRedactWithPaymentOlderThanSevenYears()

  const agreementsToRedact = [...agreementsWithNoPayment, ...agreementsWithRejectedPayment, ...agreementsWithPayment].map(a => { return { ...a, requestedDate } })
  await Promise.all(agreementsToRedact.map((agreement) => createApplicationRedact(agreement)))

  // get all (old/new) applications to redact
  return getApplicationsToRedactFor(requestedDate)
}

const callDocumentGeneratorRedactPII = async (agreementsToRedact, logger) => {
  const endpoint = `${documentGeneratorApiUri}/redact/pii`
  const agreementsToRedactPayload = agreementsToRedact.map(({ reference, data }) => { return { reference, sbi: data.sbi } })
  try {
    await wreck.post(endpoint, { json: true, payload: { agreementsToRedact: agreementsToRedactPayload } })
  } catch (err) {
    logger.setBindings({ err, endpoint })
    await updateAllAgreements(agreementsToRedact, true, '', 'N')
    throw err
  }
}

const callSfdMessagingProxyRedactPII = async (agreementsToRedact, logger) => {
  const endpoint = `${sfdMessagingProxyApiUri}/redact/pii`
  const agreementsToRedactPayload = agreementsToRedact.map(({ reference }) => { return { reference } })
  try {
    await wreck.post(endpoint, { json: true, payload: { agreementsToRedact: agreementsToRedactPayload } })
  } catch (err) {
    logger.setBindings({ err, endpoint })
    await updateAllAgreements(agreementsToRedact, true, 'documents', 'N')
    throw err
  }
}

const applicationStorageAccountTablesRedactPII = async (agreementsToRedact, logger) => {
  try {
    logger.info(`applicatioStorageAccountTablesRedactPII with: ${JSON.stringify(agreementsToRedact)}`)
    await Promise.all(
      agreementsToRedact.map(async ({ data }) => {
        const { sbi, claims } = data
        await redactApplicationEventPII(sbi)
        await redactIneligibilityPII(sbi)
        await Promise.all(
          claims.map(({ reference }) => redactStatusPII(reference))
        )
      })
    )
  } catch (err) {
    logger.setBindings({ err })
    await updateAllAgreements(agreementsToRedact, true, 'documents,messages', 'N')
    throw err
  }
}

const applicationDatabaseRedactPII = async (agreementsToRedact, logger) => {
  try {
    await Promise.all(
      agreementsToRedact.map(async (agreement) => {
        await redactHerdPII(agreement.reference)
        await redactFlagPII(agreement.reference)
        await redactContactHistoryPII(agreement.reference, logger)
        await redactClaimPII(agreement.reference)
        await redactApplicationPII(agreement.reference, logger)
      })
    )
    logger.info(`applicationDatabaseRedactPII with: ${JSON.stringify(agreementsToRedact)}`)
  } catch (err) {
    logger.setBindings({ err })
    await updateAllAgreements(agreementsToRedact, true, 'documents,messages,storage-accounts', 'N')
    throw err
  }
}

const updateAllAgreements = async (agreementsToRedact, incrementRetryCount, status, success) => {
  // only replace status if we got further than previous attempts
  const statusFromPreviousAttempts = agreementsToRedact[0]?.status ?? ''
  const statusToStore = (statusFromPreviousAttempts.length > status.length) ? statusFromPreviousAttempts : status

  await Promise.all(agreementsToRedact.map((a) => {
    const retryCount = incrementRetryCount ? Number(a.retryCount) + 1 : a.retryCount
    return updateApplicationRedact(a.id, retryCount, statusToStore, success)
  }))
}
