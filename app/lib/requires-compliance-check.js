import { config } from '../config'
import { applicationStatus } from '../constants/application-status'
import { getAllClaimedClaims } from '../repositories/claim-repository'
import { getAllClaimedApplications } from '../repositories/application-repository'

export const requiresComplianceCheck = async (claimOrApplication) => {
  const claimStatusIds = [applicationStatus.inCheck, applicationStatus.readyToPay, applicationStatus.rejected, applicationStatus.onHold, applicationStatus.recommendToPay, applicationStatus.recommendToReject]
  let complianceCheckRatio

  let claimedApplicationsCount
  
  if (claimOrApplication === 'claim') {
    claimedApplicationsCount = await getAllClaimedClaims(claimStatusIds)
    complianceCheckRatio = Number(config.compliance.endemicsComplianceCheckRatio)
  } else {
    claimedApplicationsCount = await getAllClaimedApplications(claimStatusIds)
    complianceCheckRatio = Number(config.compliance.complianceCheckRatio)
  }

  let statusId = applicationStatus.inCheck
  let claimed = false

  if (complianceCheckRatio <= 0 || (claimedApplicationsCount + 1) % complianceCheckRatio !== 0) {
    // if the claim does not trigger the configurable compliance check volume ratio, set as onHold
    // if complianceCheckRatio is 0 or less this means compliance checks are turned off
    statusId = applicationStatus.onHold
    claimed = true
  }
  return { claimed, statusId }
}
