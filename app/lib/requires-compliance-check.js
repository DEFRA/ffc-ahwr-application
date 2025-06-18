import { config } from '../config/index.js'
import { applicationStatus } from '../constants/index.js'
import { getAndIncrementComplianceCheckCount } from '../repositories/compliance-check-count.js'

export const generateClaimStatus = async (visitDateAsString, species, herdId, previousClaims, logger) => {
  if (isFeatureAssuranceEnabledAndStartedBeforeVisitDate(visitDateAsString)) {
    return await getClaimStatusBasedOnFeatureAssuranceRules(species, herdId, previousClaims, logger)
  }

  return await getClaimStatusBasedOnRatio()
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
  return config.featureAssurance.enabled && new Date(visitDateAsString) >= new Date(config.featureAssurance.startDate)
}

const getClaimStatusBasedOnFeatureAssuranceRules = async (species, herdId, previousClaims, logger) => {
  // previous claims have been updated to include herd info were neccessary by this point,
  // so don't need to deferenciate between herdless claims being linked to claim being processed or not.
  const hasClaimedForMultipleHerdsForSpecies = previousClaims.some(c => c.typeOfLivestock === species && c.herdId !== herdId)

  if (hasClaimedForMultipleHerdsForSpecies) {
    logger.info(`Agreement '${previousClaims[0].applicationReference}' had a claim set to inCheck due to feature assurance rules`)
    return applicationStatus.inCheck
  }

  return await getClaimStatusBasedOnRatio()
}
