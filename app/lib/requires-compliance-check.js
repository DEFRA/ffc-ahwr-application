import { config } from '../config/index.js'
import { applicationStatus } from '../constants/index.js'
import { getAllClaimedClaims } from '../repositories/claim-repository.js'

export const requiresComplianceCheck = async () => {
  const claimStatusIds = [applicationStatus.inCheck, applicationStatus.readyToPay, applicationStatus.rejected, applicationStatus.onHold, applicationStatus.recommendToPay, applicationStatus.recommendToReject]

  const claimedApplicationsCount = await getAllClaimedClaims(claimStatusIds)
  const complianceCheckRatio = Number(config.complianceCheckRatio)

  let statusId = applicationStatus.inCheck

  if (complianceCheckRatio <= 0 || (claimedApplicationsCount + 1) % complianceCheckRatio !== 0) {
    // if the claim does not trigger the configurable compliance check volume ratio, set as onHold
    // if complianceCheckRatio is 0 or less this means compliance checks are turned off
    statusId = applicationStatus.onHold
  }

  return statusId
}
