import wreck from '@hapi/wreck'
import { config } from '../../config/index.js'
import { redactPII as redactApplicationPII } from '../../repositories/application-repository.js'
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
  logger.setBindings({ redactPiiRequested: message.body.requestDate })

  const agreementsToRedact = getAgreementsToRedactWithRedactID()

  await callDocumentGeneratorRedactPII(agreementsToRedact, logger)
  await callSfdMessagingProxyRedactPII(agreementsToRedact, logger)

  await applicationStorageAccountTablesRedactPII(agreementsToRedact, logger)
  await applicationDatabaseRedactPII(agreementsToRedact, logger)

  logger.info('Successfully processed redact PII request')
}

const getAgreementsToRedactWithRedactID = () => {
  const agreementsToRedactForRequestedDate = [] // TODO 1067 check in reacted table.. use rows if exist for requestedDate
  if (agreementsToRedactForRequestedDate && agreementsToRedactForRequestedDate.length > 0) {
    return agreementsToRedactForRequestedDate
  }

  // TODO IMPL 1067
  const agreementsWithNoPayment = [
    { redactId: 'AHWR-A271-8752-REDACTED-PII', requestedDate: '2025-07-22T10:00:00.00000000Z', type: 'PII', reference: 'AHWR-A271-8752', data: { sbi: '107597689', claims: [{ reference: 'AHWR-0000-1111' }] } },
    { redactId: 'IAHW-AAAA-AAAA-REDACTED-PII', requestedDate: '2025-07-22T10:00:00.00000000Z', type: 'PII', reference: 'IAHW-AAAA-AAAA', data: { sbi: '107597689', claims: [{ reference: 'REBC-AAAA-AAA1' }, { reference: 'REBC-AAAA-AAA2' }] } }
  ]
  // TODO IMPL 1070
  const agreementsWithRejectedPayment = []
  // TODO IMPL 1068
  const agreementsWithPayment = []

  // TODO 1067 store in reacted table.. include requestedDate as PK, redactId, type,

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
    throw err
  }
}
