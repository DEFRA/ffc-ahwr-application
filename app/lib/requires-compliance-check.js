import { config } from '../config/index.js'
import { applicationStatus } from '../constants/index.js'
import { getAndIncrementComplianceCheckCount } from '../repositories/compliance-check-count.js'

export const generateClaimStatus = async () => {
  const complianceCheckRatio = Number(config.complianceCheckRatio)

  // if complianceCheckRatio is 0 or less this means compliance checks are turned off
  if (complianceCheckRatio <= 0) {
    return applicationStatus.onHold
  }

  const complianceCheckCount = await getAndIncrementComplianceCheckCount()

  // if claim hits the compliance check ratio, it should be inCheck
  if (complianceCheckCount % complianceCheckRatio === 0) {
    return applicationStatus.inCheck
  }

  return applicationStatus.onHold
}
