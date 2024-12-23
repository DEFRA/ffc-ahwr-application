const { compliance } = require('../config')
const statusIds = require('../constants/application-status')
const { getAllClaimedClaims } = require('../repositories/claim-repository')
const { getAllClaimedApplications } = require('../repositories/application-repository')

module.exports = async function requiresComplianceCheck (claimOrApplication) {
  const claimStatusIds = [statusIds.inCheck, statusIds.readyToPay, statusIds.rejected, statusIds.onHold, statusIds.recommendToPay, statusIds.recommendToReject]
  let complianceCheckRatio

  let claimedApplicationsCount
  if (claimOrApplication === 'claim') {
    claimedApplicationsCount = await getAllClaimedClaims(claimStatusIds)
    complianceCheckRatio = compliance.endemicsComplianceCheckRatio
  } else {
    claimedApplicationsCount = await getAllClaimedApplications(claimStatusIds)
    complianceCheckRatio = compliance.complianceCheckRatio
  }

  // default to IN_CHECK status
  let statusId = statusIds.inCheck
  let claimed = false

  if (complianceCheckRatio <= 0 || (claimedApplicationsCount + 1) % complianceCheckRatio !== 0) {
    // if the claim does not trigger the configurable compliance check volume ratio set as onHold
    // if complianceCheckRatio is 0 or less this means compliance checks are turned off
    statusId = statusIds.onHold
    claimed = true
  }
  return { claimed, statusId }
}
