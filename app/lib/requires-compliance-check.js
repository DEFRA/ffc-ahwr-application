const statusIds = require('../constants/application-status')
const { getAllClaimedApplications } = require('../repositories/application-repository')

/**
 * This function determines whether the claim being processed can be sent directly for payment (READY_TO_PAY) or
 * whether it has to go through a manual compliance check (IN_CHECK)
 * @param {*} claimStatusIds an array of status IDs that represent an agreement where a claim has been made
 * @returns an object containing a statusId and a claimed indicator
 */
module.exports = async function requiresComplianceCheck (claimStatusIds, applicationCount) {
  const claimedApplicationsCount = await getAllClaimedApplications(claimStatusIds)

  // default to IN_CHECK status
  let statusId = statusIds.inCheck
  let claimed = false

  if (claimedApplicationsCount === 0 || (claimedApplicationsCount + 1) % applicationCount !== 0) {
    // if the claim does not trigger the configururable compliance check volume ratio set as READY_TO_PAY
    // if claimedApplicationsCount is 0 this means compliance checks are turned off
    statusId = statusIds.readyToPay
    claimed = true
  }
  return { claimed, statusId }
}
