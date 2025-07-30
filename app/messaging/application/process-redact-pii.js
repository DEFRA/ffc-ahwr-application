import wreck from '@hapi/wreck'
import { config } from '../../config/index.js'
import { getReferencesByRequestedDate, createApplicationRedact, updateApplicationRedact } from '../../repositories/application-redact-repository.js'
import { getAgreementsWithNoPaymentOlderThanThreeYears, getAgreementsWithRejectedPaymentOlderThanThreeYears, getAgreementsWithPaymentOlderThanSevenYears, redactPII as redactApplicationPII } from '../../repositories/application-repository.js'
import { redactPII as redactClaimPII } from '../../repositories/claim-repository.js'
import { redactPII as redactContactHistoryPII } from '../../repositories/contact-history-repository.js'
import { redactPII as redactFlagPII } from '../../repositories/flag-repository.js'
import { redactPII as redactHerdPII } from '../../repositories/herd-repository.js'
import { redactPII as redactStatusPII } from '../../azure-storage/application-status-repository.js'
import { redactPII as redactIneligibilityPII } from '../../azure-storage/application-ineligibility-repository.js'
import { deleteApplicationEvents } from '../../azure-storage/application-eventstore-repository.js'

const { documentGeneratorApiUri, sfdMessagingProxyApiUri } = config

// TODO 1067 database updates should update the updatedBy
export const processRedactPiiRequest = async (message, logger) => {
  logger.setBindings({ redactRequestedDate: message.body.requestedDate })

  const agreementsToRedact = await getAgreementsToRedact(message.body.requestedDate)
  if(agreementsToRedact.length == 0) {
    logger.info('No new agreements to redact for this date')
  }

  await callDocumentGeneratorRedactPII(agreementsToRedact, logger)
  await callSfdMessagingProxyRedactPII(agreementsToRedact, logger)

  await applicationStorageAccountTablesRedactPII(agreementsToRedact, logger)
  await applicationDatabaseRedactPII(agreementsToRedact, logger)

  updateAllAgreements(agreementsToRedact, false, 'documents,messages,storage-accounts,database-tables', 'Y')
  logger.info('Successfully processed redact PII request')
}

const getAgreementsToRedact = async (redactRequestedDate) => {
  const agreementsWithNoPayment = await getAgreementsWithNoPaymentOlderThanThreeYears()
  const agreementsWithRejectedPayment = await getAgreementsWithRejectedPaymentOlderThanThreeYears()
  const agreementsWithPayment = await getAgreementsWithPaymentOlderThanSevenYears()
  const agreementsToRedact = [...agreementsWithNoPayment, ...agreementsWithRejectedPayment, ...agreementsWithPayment]
    .map(a => { return { ...a, requestedDate: redactRequestedDate } } )

  const applicationsForRequestedDate = await getReferencesByRequestedDate(redactRequestedDate)

  const applicationReferences = applicationsForRequestedDate.map(a => a.dataValues.reference)
  const newApplicationsToRedact = agreementsToRedact.filter(agreement => !applicationReferences?.includes(agreement.reference))
  const newApplicationRedacts = await Promise.all(newApplicationsToRedact.map((agreement) => createApplicationRedact(agreement)))

  const applicationsNotProcessedForRequestedDate = applicationsForRequestedDate.filter(a => a.dataValues.success === 'N')
  return [ ...newApplicationRedacts, ...applicationsNotProcessedForRequestedDate ]
}

const callDocumentGeneratorRedactPII = async (agreementsToRedact, logger) => {
  const endpoint = `${documentGeneratorApiUri}/redact/pii`
  const agreementsToRedactPayload = agreementsToRedact.map(({reference, data}) => { return { reference, sbi: data.sbi } })
  try {
    await wreck.post(endpoint, { json: true, payload: { agreementsToRedact: agreementsToRedactPayload } })
  } catch (err) {
    logger.setBindings({ err, endpoint })
    updateAllAgreements(agreementsToRedact, true, '', 'N')
    throw err
  }
}

const callSfdMessagingProxyRedactPII = async (agreementsToRedact, logger) => {
  const endpoint = `${sfdMessagingProxyApiUri}/redact/pii`
  const agreementsToRedactPayload = agreementsToRedact.map(({reference}) => { return { reference } })
  try {
    await wreck.post(endpoint, { json: true, payload: { agreementsToRedact: agreementsToRedactPayload } })
  } catch (err) {
    logger.setBindings({ err, endpoint })
    updateAllAgreements(agreementsToRedact, true, 'documents', 'N')
    throw err
  }
}

const applicationStorageAccountTablesRedactPII = async (agreementsToRedact, logger) => {
  try {
    logger.info(`applicatioStorageAccountTablesRedactPII with: ${JSON.stringify(agreementsToRedact)}`)
    agreementsToRedact.forEach(agreementToRedact => {
      deleteApplicationEvents(agreementToRedact.data.sbi)
      redactIneligibilityPII(agreementToRedact.data.sbi)
      agreementToRedact.data.claims.forEach(claimToRedact => {
        redactStatusPII(claimToRedact.reference)
      })
    })
  } catch (err) {
    logger.setBindings({ err })
    updateAllAgreements(agreementsToRedact, true, 'documents,messages', 'N')
    throw err
  }
}

const applicationDatabaseRedactPII = async (agreementsToRedact, logger) => {
  try {
    agreementsToRedact.forEach(agreementToRedact => {
      redactHerdPII(agreementToRedact.reference)
      redactFlagPII(agreementToRedact.reference)
      redactContactHistoryPII(agreementToRedact.reference)
      redactClaimPII(agreementToRedact.reference)
      redactApplicationPII(agreementToRedact.reference)
    })
    logger.info(`applicationDatabaseRedactPII with: ${JSON.stringify(agreementsToRedact)}`)
  } catch (err) {
    logger.setBindings({ err })
    updateAllAgreements(agreementsToRedact, true, 'documents,messages,storage-accounts', 'N')
    throw err
  }
}

const updateAllAgreements = (agreementsToRedact, incrementRetryCount, status, success) => {
  // only replace status if we got further than previous attempts
  const statusFromPreviousAttempts = agreementsToRedact[0]?.status ?? ''
  const statusToStore = (statusFromPreviousAttempts.length > status.length) ? statusFromPreviousAttempts : status

  agreementsToRedact.forEach(async (a) => {
    const retryCount = incrementRetryCount ? Number(a.retryCount)+1 : a.retryCount
    await updateApplicationRedact(a.id, retryCount, statusToStore, success)
  })
}
