import wreck from '@hapi/wreck'
import { config } from '../../config/index.js'
import { getApplicationsToRedactFor, createApplicationRedact, updateApplicationRedact } from '../../repositories/application-redact-repository.js'
import { getApplicationsToRedactWithNoPaymentOlderThanThreeYears, getApplicationsToRedactWithRejectedPaymentOlderThanThreeYears, getApplicationsToRedactWithPaymentOlderThanSevenYears, redactPII as redactApplicationPII } from '../../repositories/application-repository.js'
import { redactPII as redactClaimPII } from '../../repositories/claim-repository.js'
import { redactPII as redactContactHistoryPII } from '../../repositories/contact-history-repository.js'
import { createFlagForRedactPII, redactPII as redactFlagPII } from '../../repositories/flag-repository.js'
import { redactPII as redactHerdPII } from '../../repositories/herd-repository.js'
import { redactPII as redactStatusPII } from '../../azure-storage/application-status-repository.js'
import { redactPII as redactIneligibilityPII } from '../../azure-storage/application-ineligibility-repository.js'
import { redactPII as redactApplicationEventPII } from '../../azure-storage/application-eventstore-repository.js'
import { raiseApplicationFlaggedEvent } from '../../event-publisher/index.js'

const { documentGeneratorApiUri, sfdMessagingProxyApiUri } = config

// TODO move to common-library
const REDACT_PII_PROGRESS_STATUS = {
  GOT_APPLICATIONS_TO_REDACT: 'applications-to-redact',
  DOCUMENT_GENERATOR_REDACTED: 'documents',
  SFD_MESSAGE_PROXY_REDACTED: 'messages',
  APPLICATION_STORAGE_REDACTED: 'storage-accounts',
  APPLICATION_DATABASE_REDACTED: 'database-tables',
  APPLICATION_REDACT_FLAG_ADDED: 'redacted-flag',
}

export const processRedactPiiRequest = async (message, logger) => {
  const redactRequestedDate = message.body.requestedDate
  logger.setBindings({ redactRequestedDate })
  const { GOT_APPLICATIONS_TO_REDACT, DOCUMENT_GENERATOR_REDACTED, SFD_MESSAGE_PROXY_REDACTED, APPLICATION_STORAGE_REDACTED, APPLICATION_DATABASE_REDACTED, APPLICATION_REDACT_FLAG_ADDED } = REDACT_PII_PROGRESS_STATUS

  const applicationsToRedactAlreadyStored = await getApplicationsToRedactFor(redactRequestedDate)
  // TODO test works
  const redactProgress = getProgressStatusFromPreviousAttempts(applicationsToRedactAlreadyStored) ?? []

  let applicationsToRedact = applicationsToRedactAlreadyStored
  if(!redactProgress.includes(GOT_APPLICATIONS_TO_REDACT)) {
    applicationsToRedact = await getApplicationsToRedact(message.body.requestedDate)
    redactProgress.push(GOT_APPLICATIONS_TO_REDACT)
  }

  if (applicationsToRedact.length === 0) {
    logger.info('No new applications to redact for this date')
    return
  }

  if(!redactProgress.includes(DOCUMENT_GENERATOR_REDACTED)) {
    await callDocumentGeneratorRedactPII(applicationsToRedact, redactProgress, logger)
    redactProgress.push(DOCUMENT_GENERATOR_REDACTED)
  }
  if(!redactProgress.includes(SFD_MESSAGE_PROXY_REDACTED)) {
    await callSfdMessagingProxyRedactPII(applicationsToRedact, redactProgress, logger)
    redactProgress.push(SFD_MESSAGE_PROXY_REDACTED)
  }

  if(!redactProgress.includes(APPLICATION_STORAGE_REDACTED)) {
    await applicationStorageAccountTablesRedactPII(applicationsToRedact, redactProgress, logger)
    redactProgress.push(APPLICATION_STORAGE_REDACTED)
  }
  if(!redactProgress.includes(APPLICATION_DATABASE_REDACTED)) {
    await applicationDatabaseRedactPII(applicationsToRedact, redactProgress, logger)
    redactProgress.push(APPLICATION_DATABASE_REDACTED)
  }

  if(!redactProgress.includes(APPLICATION_REDACT_FLAG_ADDED)) {
    await addFlagForRedactPII(applicationsToRedact, redactProgress, logger)
    redactProgress.push(APPLICATION_REDACT_FLAG_ADDED)
  }

  await updateApplicationRedactRecords(applicationsToRedact, false, redactProgress, 'Y')
  logger.info('Successfully processed redact PII request')
}

const getApplicationsToRedact = async (requestedDate) => {
  const agreementsWithNoPayment = await getApplicationsToRedactWithNoPaymentOlderThanThreeYears()
  const agreementsWithRejectedPayment = await getApplicationsToRedactWithRejectedPaymentOlderThanThreeYears()
  const agreementsWithPayment = await getApplicationsToRedactWithPaymentOlderThanSevenYears()

  const agreementsToRedact = [...agreementsWithNoPayment, ...agreementsWithRejectedPayment, ...agreementsWithPayment].map(a => { return { ...a, requestedDate } })
  return await Promise.all(agreementsToRedact.map((agreement) => createApplicationRedact(agreement)))
}

const getProgressStatusFromPreviousAttempts = (agreementsToRedact) => {
  return agreementsToRedact.length === 0 ? [] : agreementsToRedact[0].status?.split(',') ?? []
}

const callDocumentGeneratorRedactPII = async (agreementsToRedact, redactProgress, logger) => {
  const endpoint = `${documentGeneratorApiUri}/redact/pii`
  const agreementsToRedactPayload = agreementsToRedact.map(({ reference, data }) => { return { reference, sbi: data.sbi } })
  try {
    await wreck.post(endpoint, { json: true, payload: { agreementsToRedact: agreementsToRedactPayload } })
  } catch (err) {
    logger.setBindings({ err, endpoint })
    await updateApplicationRedactRecords(agreementsToRedact, true, redactProgress, 'N')
    throw err
  }
}

const callSfdMessagingProxyRedactPII = async (agreementsToRedact, redactProgress, logger) => {
  const endpoint = `${sfdMessagingProxyApiUri}/redact/pii`
  const agreementsToRedactPayload = agreementsToRedact.map(({ reference }) => { return { reference } })
  try {
    await wreck.post(endpoint, { json: true, payload: { agreementsToRedact: agreementsToRedactPayload } })
  } catch (err) {
    logger.setBindings({ err, endpoint })
    await updateApplicationRedactRecords(agreementsToRedact, true, redactProgress, 'N')
    throw err
  }
}

const applicationStorageAccountTablesRedactPII = async (agreementsToRedact, redactProgress, logger) => {
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
    await updateApplicationRedactRecords(agreementsToRedact, true, redactProgress, 'N')
    throw err
  }
}

const applicationDatabaseRedactPII = async (agreementsToRedact, redactProgress, logger) => {
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
    await updateApplicationRedactRecords(agreementsToRedact, true, redactProgress, 'N')
    throw err
  }
}

const addFlagForRedactPII = async (agreementsToRedact, redactProgress, logger) => {
  try {
    await Promise.all(
      agreementsToRedact.map(async (agreement) => {
        const applicationReference = agreement.reference
        const sbi = agreement.data.sbi

        const result = await createFlagForRedactPII({
          applicationReference,
          sbi,
          note: 'Application PII redacted',
          createdBy: 'admin',
          appliesToMh: false
        })

        await raiseApplicationFlaggedEvent({
          application: { id: applicationReference },
          message: 'Application flagged',
          flag: { id: result.dataValues.id, note: result.dataValues.note, appliesToMh: result.dataValues.appliesToMh },
          raisedBy: result.dataValues.createdBy,
          raisedOn: result.dataValues.createdAt
        }, sbi)
      })
    )
    logger.info(`addFlagForRedactPII with: ${JSON.stringify(agreementsToRedact)}`)
  } catch (err) {
    logger.setBindings({ err })
    await updateApplicationRedactRecords(agreementsToRedact, true, redactProgress, 'N')
    throw err
  }
}

const updateApplicationRedactRecords = async (agreementsToRedact, incrementRetryCount, progressStatus, success) => {
  await Promise.all(agreementsToRedact.map((a) => {
    const retryCount = incrementRetryCount ? Number(a.retryCount) + 1 : a.retryCount
    return updateApplicationRedact(a.id, retryCount, progressStatus.join(), success)
  }))
}
