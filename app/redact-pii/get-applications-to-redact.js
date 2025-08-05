import { getFailedApplicationRedact, createApplicationRedact } from '../repositories/application-redact-repository.js'
import { getApplicationsToRedactWithNoPaymentOlderThanThreeYears, getApplicationsToRedactWithRejectedPaymentOlderThanThreeYears, getApplicationsToRedactWithPaymentOlderThanSevenYears } from '../repositories/application-repository.js'

// TODO move to common-library
const REDACT_PII_PROGRESS_STATUS = {
  GOT_APPLICATIONS_TO_REDACT: 'applications-to-redact',
  DOCUMENT_GENERATOR_REDACTED: 'documents',
  SFD_MESSAGE_PROXY_REDACTED: 'messages',
  APPLICATION_STORAGE_REDACTED: 'storage-accounts',
  APPLICATION_DATABASE_REDACTED: 'database-tables',
  APPLICATION_REDACT_FLAG_ADDED: 'redacted-flag'
}
const { GOT_APPLICATIONS_TO_REDACT } = REDACT_PII_PROGRESS_STATUS

export const getApplicationsToRedact = async (requestedDate) => {
  const failedApplicationRedact = await getFailedApplicationRedact(requestedDate)
  // TODO test works
  const status = getStatus(failedApplicationRedact) ?? []

  let applicationsToRedact = failedApplicationRedact
  if (!status.includes(GOT_APPLICATIONS_TO_REDACT)) {
    applicationsToRedact = await updateApplicationsToRedact(requestedDate)
    status.push(GOT_APPLICATIONS_TO_REDACT)
  }

  return {
    applicationsToRedact,
    status
  }
}

const updateApplicationsToRedact = async (requestedDate) => {
  const agreementsWithNoPayment = await getApplicationsToRedactWithNoPaymentOlderThanThreeYears()
  const agreementsWithRejectedPayment = await getApplicationsToRedactWithRejectedPaymentOlderThanThreeYears()
  const agreementsWithPayment = await getApplicationsToRedactWithPaymentOlderThanSevenYears()

  const agreementsToRedact = [...agreementsWithNoPayment, ...agreementsWithRejectedPayment, ...agreementsWithPayment]
    .map(a => { return { ...a, requestedDate } })

  return Promise.all(agreementsToRedact.map((agreement) => createApplicationRedact(agreement)))
}

const getStatus = (agreementsToRedact) => {
  return agreementsToRedact.length === 0 ? [] : agreementsToRedact[0].status?.split(',') ?? []
}
