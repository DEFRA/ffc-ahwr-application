import { REDACT_PII_PROGRESS_STATUS } from 'ffc-ahwr-common-library'
import { getFailedApplicationRedact, createApplicationRedact } from '../repositories/application-redact-repository.js'
import { getApplicationsToRedactWithNoPaymentOlderThanThreeYears, getApplicationsToRedactWithRejectedPaymentOlderThanThreeYears, getApplicationsToRedactWithPaymentOlderThanSevenYears } from '../repositories/application-repository.js'

const { GOT_APPLICATIONS_TO_REDACT } = REDACT_PII_PROGRESS_STATUS

export const getApplicationsToRedact = async (requestedDate) => {
  let applicationsToRedact = await getFailedApplicationRedact(requestedDate)
  const status = getStatus(applicationsToRedact) ?? []

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
