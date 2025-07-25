import { config } from '../config/index.js'
import { applicationStatus } from '../constants/index.js'
import { getAndIncrementComplianceCheckCount } from '../repositories/compliance-check-count.js'

export const generateClaimStatus = async (visitDateAsString, herdId, previousClaimsForSpecies, logger) => {
  if (isFeatureAssuranceEnabledAndStartedBeforeVisitDate(visitDateAsString)) {
    return getClaimStatusBasedOnFeatureAssuranceRules(herdId, previousClaimsForSpecies, logger)
  }

  return getClaimStatusBasedOnRatio()
}

const getClaimStatusBasedOnRatio = async () => {
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

const isFeatureAssuranceEnabledAndStartedBeforeVisitDate = (visitDateAsString) => {
  return config.featureAssurance.enabled && config.featureAssurance.startDate && new Date(visitDateAsString) >= new Date(config.featureAssurance.startDate)
}

const getClaimStatusBasedOnFeatureAssuranceRules = async (herdId, previousClaimsForSpecies, logger) => {
  // previous claims have been updated to include herd info were neccessary by this point,
  // so don't need to differentiate between unnamed herd claims being linked to the claim being processed or not.
  const hasClaimedForMultipleHerdsForSpecies = previousClaimsForSpecies.some(c => c.data.herdId !== herdId)

  if (hasClaimedForMultipleHerdsForSpecies) {
    logger.info(`Agreement '${previousClaimsForSpecies[0].applicationReference}' had a claim set to inCheck due to feature assurance rules`)
    return applicationStatus.inCheck
  }

  return getClaimStatusBasedOnRatio()
}
