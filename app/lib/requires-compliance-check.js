const { compliance } = require('../config')
const statusIds = require('../constants/application-status')
const { getAllClaimedClaims } = require('../repositories/claim-repository')
const { getAllClaimedApplications } = require('../repositories/application-repository')

/**
 * This function determines whether the claim being processed can be sent directly for payment (READY_TO_PAY) or
 * whether it has to go through a manual compliance check (IN_CHECK)
 * @param {*} claimStatusIds an array of status IDs that represent an agreement where a claim has been made
 * @param {*} complianceCheckRatio the ratio of compliance checks e.g. 3 indicates one in every 3 claims are checked
 * @returns an object containing a statusId and a claimed indicator
 */
module.exports = async function requiresComplianceCheck (claimOrApplication) {
  const claimStatusIds = [statusIds.inCheck, statusIds.readyToPay, statusIds.rejected, statusIds.onHold, statusIds.recommendToPay, statusIds.recommendToReject]

  let claimedApplicationsCount
  if (claimOrApplication === 'claim') {
    claimedApplicationsCount = await getAllClaimedClaims(claimStatusIds)
  } else {
    claimedApplicationsCount = await getAllClaimedApplications(claimStatusIds)
  }

  // default to IN_CHECK status
  let statusId = statusIds.inCheck
  let claimed = false

  if (compliance.complianceCheckRatio <= 0 || (claimedApplicationsCount + 1) % compliance.complianceCheckRatio !== 0) {
    // if the claim does not trigger the configurable compliance check volume ratio set as onHold
    // if complianceCheckRatio is 0 or less this means compliance checks are turned off
    statusId = statusIds.onHold
    claimed = true
  }
  return { claimed, statusId }
}
