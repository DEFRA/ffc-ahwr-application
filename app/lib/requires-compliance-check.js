import { config } from '../config/index.js'
import { applicationStatus } from '../constants/index.js'
import { getAllClaimedClaims } from '../repositories/claim-repository.js'

export const requiresComplianceCheck = async () => {
  const claimStatusIds = [applicationStatus.inCheck, applicationStatus.readyToPay, applicationStatus.rejected, applicationStatus.onHold, applicationStatus.recommendToPay, applicationStatus.recommendToReject]

  const claimedApplicationsCount = await getAllClaimedClaims(claimStatusIds)
  const complianceCheckRatio = Number(config.complianceCheckRatio)

  // if complianceCheckRatio is 0 or less this means compliance checks are turned off
  if (complianceCheckRatio <= 0) {
    return applicationStatus.onHold
  }

  // if claim hits the compliance check ratio, it should be inCheck
  if ((claimedApplicationsCount + 1) % complianceCheckRatio === 0) {
    return applicationStatus.inCheck
  }

  return applicationStatus.onHold
}
