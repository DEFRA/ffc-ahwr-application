import { REDACT_PII_PROGRESS_STATUS } from 'ffc-ahwr-common-library'
import { getFailedApplicationRedact, createApplicationRedact } from '../repositories/application-redact-repository.js'
import { getApplicationsToRedactWithNoPaymentOlderThanThreeYears, getApplicationsToRedactWithRejectedPaymentOlderThanThreeYears, getApplicationsToRedactWithPaymentOlderThanSevenYears } from '../repositories/application-repository.js'
import { buildData } from '../data/index.js'

const { sequelize } = buildData
const { GOT_APPLICATIONS_TO_REDACT } = REDACT_PII_PROGRESS_STATUS

export const getApplicationsToRedact = async (requestedDate) => {
  let applicationsToRedact = await getFailedApplicationRedact(requestedDate)

  if (!applicationsToRedact) {
    applicationsToRedact = await createApplicationsToRedact(requestedDate)
  }

  return {
    applicationsToRedact,
    status: getStatus(applicationsToRedact)
  }
}

const createApplicationsToRedact = async (requestedDate) => {
  const agreementsWithNoPayment = await getApplicationsToRedactWithNoPaymentOlderThanThreeYears()
  const agreementsWithRejectedPayment = await getApplicationsToRedactWithRejectedPaymentOlderThanThreeYears()
  const agreementsWithPayment = await getApplicationsToRedactWithPaymentOlderThanSevenYears()

  const agreementsToRedact = [...agreementsWithNoPayment, ...agreementsWithRejectedPayment, ...agreementsWithPayment]
    .map(a => { return { ...a, requestedDate, status: GOT_APPLICATIONS_TO_REDACT } })

  return sequelize.transaction(async () => Promise.all(
    agreementsToRedact.map((agreement) => createApplicationRedact(agreement))
  ))
}

const getStatus = (agreementsToRedact) => {
  return agreementsToRedact.length === 0 ? [] : agreementsToRedact[0].status?.split(',') ?? []
}
