import { APPLICATION_REFERENCE_PREFIX_OLD_WORLD, CLAIM_STATUS, REDACT_PII_PROGRESS_STATUS } from 'ffc-ahwr-common-library'
import { getFailedApplicationRedact, createApplicationRedact } from '../repositories/application-redact-repository.js'
import { buildData } from '../data/index.js'
import { getApplicationsToRedactOlderThan } from '../repositories/application-repository.js'
import { getByApplicationReference } from '../repositories/claim-repository.js'

const { sequelize } = buildData
const { GOT_APPLICATIONS_TO_REDACT } = REDACT_PII_PROGRESS_STATUS

const THREE_YEARS = 3

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
  const agreementsWithPayment = await getApplicationsToRedactWithPaymentOlderThanSevenYears()

  const agreementsToRedact = [...agreementsWithNoPayment, ...agreementsWithPayment]
    .map(a => { return { ...a, requestedDate, status: GOT_APPLICATIONS_TO_REDACT } })

  return sequelize.transaction(async () => Promise.all(
    agreementsToRedact.map((agreement) => createApplicationRedact(agreement))
  ))
}

const getStatus = (agreementsToRedact) => {
  return agreementsToRedact.length === 0 ? [] : agreementsToRedact[0].status?.split(',') ?? []
}

const getApplicationsToRedactWithNoPaymentOlderThanThreeYears = async () => {
  const claimStatusPaid = [CLAIM_STATUS.PAID, CLAIM_STATUS.READY_TO_PAY]
  const applicationsOlderThanThreeYears = await getApplicationsToRedactOlderThan(THREE_YEARS)

  const agreementsToRedactWithNoPayment = await Promise.all(
    applicationsOlderThanThreeYears
      .map(async (application) => {
        if (application.reference.startsWith(APPLICATION_REFERENCE_PREFIX_OLD_WORLD)) {
          return owApplicationRedactDataIfNoPaymentClaimElseNull(application, claimStatusPaid)
        } else {
          return await nwApplicationRedactDataIfNoPaymentClaimsElseNull(application, claimStatusPaid)
        }
      })
      .filter(Boolean) // remove nulls
  )

  return agreementsToRedactWithNoPayment
}

const owApplicationRedactDataIfNoPaymentClaimElseNull = (oldWorldApplication, claimStatusPaid) => {
  // skip if application has paid
  return claimStatusPaid.includes(oldWorldApplication.statusId)
    ? null
    : { reference: oldWorldApplication.reference, data: { sbi: oldWorldApplication.sbi, claims: [{ reference: oldWorldApplication.reference }] } }
}

const nwApplicationRedactDataIfNoPaymentClaimsElseNull = async (newWorldApplication, claimStatusPaid) => {
  const appClaims = await getByApplicationReference(newWorldApplication.reference)

  // skip if application has paid
  if (appClaims.some(c => claimStatusPaid.includes(c.statusId))) {
    return null
  }

  const claims = appClaims.map(c => ({ reference: c.reference }))
  return { reference: newWorldApplication.reference, data: { sbi: newWorldApplication.sbi, claims } }
}

// TODO 1068 IMPL
const getApplicationsToRedactWithPaymentOlderThanSevenYears = async () => {
  const agreementsWithPayment = []
  return agreementsWithPayment
}
