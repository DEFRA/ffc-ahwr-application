import { APPLICATION_REFERENCE_PREFIX_OLD_WORLD, CLAIM_STATUS, REDACT_PII_PROGRESS_STATUS } from 'ffc-ahwr-common-library'
import { getFailedApplicationRedact, createApplicationRedact } from '../repositories/application-redact-repository.js'
import { buildData } from '../data/index.js'
import { getApplicationsToRedactOlderThan } from '../repositories/application-repository.js'
import { getByApplicationReference } from '../repositories/claim-repository.js'

const { sequelize } = buildData
const { GOT_APPLICATIONS_TO_REDACT } = REDACT_PII_PROGRESS_STATUS

const THREE_YEARS = 3
const SEVEN_YEARS = 7

const CLAIM_STATUS_PAID = [CLAIM_STATUS.PAID, CLAIM_STATUS.READY_TO_PAY]

export const getApplicationsToRedact = async (requestedDate) => {
  let applicationsToRedact = await getFailedApplicationRedact(requestedDate)

  if (!applicationsToRedact || applicationsToRedact.length === 0) {
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
  const applicationsOlderThanThreeYears = await getApplicationsToRedactOlderThan(THREE_YEARS)

  const agreementsToRedactWithNoPayment = (
    await Promise.all(
      applicationsOlderThanThreeYears.map(async (application) => {
        if (application.reference.startsWith(APPLICATION_REFERENCE_PREFIX_OLD_WORLD)) {
          return owApplicationRedactDataIfNoPaymentClaimElseNull(application)
        } else {
          return nwApplicationRedactDataIfNoPaymentClaimsElseNull(application)
        }
      })
    )
  ).filter(Boolean) // remove nulls

  return agreementsToRedactWithNoPayment
}
const buildApplicationRedact = (reference, sbi, claimReferences) => ({ reference, data: { sbi, claims: claimReferences.map((claimReference) => ({ reference: claimReference })) } })

const owApplicationRedactDataIfNoPaymentClaimElseNull = (oldWorldApplication) => {
  // skip if application has paid
  return CLAIM_STATUS_PAID.includes(oldWorldApplication.statusId)
    ? null
    : buildApplicationRedact(oldWorldApplication.reference, oldWorldApplication.dataValues.sbi, [oldWorldApplication.reference])
}

const nwApplicationRedactDataIfNoPaymentClaimsElseNull = async (newWorldApplication) => {
  const appClaims = await getByApplicationReference(newWorldApplication.reference)

  // skip if application has paid
  if (appClaims.some(c => CLAIM_STATUS_PAID.includes(c.statusId))) {
    return null
  }
  const claimReferences = appClaims.map(c => c.reference)
  return buildApplicationRedact(newWorldApplication.reference, newWorldApplication.dataValues.sbi, claimReferences)
}

const getApplicationsToRedactWithPaymentOlderThanSevenYears = async () => {
  const applicationsOlderThanThreeYears = await getApplicationsToRedactOlderThan(SEVEN_YEARS)

  const agreementsToRedact = (
    await Promise.all(
      applicationsOlderThanThreeYears.map(async ({ reference, dataValues: { sbi } }) => {
        let claimReferences

        if (reference.startsWith(APPLICATION_REFERENCE_PREFIX_OLD_WORLD)) {
          claimReferences = [reference]
        } else {
          const appClaims = await getByApplicationReference(reference)
          claimReferences = appClaims.map(c => c.reference)
        }

        return buildApplicationRedact(reference, sbi, claimReferences)
      })
    )
  )

  return agreementsToRedact
}
