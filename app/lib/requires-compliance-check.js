import { config } from '../config/index.js'
import { applicationStatus } from '../constants/index.js'
import { getAndIncrementComplianceCheckCount } from '../repositories/compliance-check-count.js'

export const generateClaimStatus = async (visitDateAsString, species, herdId, previousClaims) => {
  if (isFeatureAssuranceEnabledAndStartedBeforeVisitDate(visitDateAsString)) {
    return await getClaimStatusBasedOnFeatureAssuranceRules(species, herdId, previousClaims)
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
  return config.featureAssurance.enabled && new Date(visitDateAsString) >= new Date(config.featureAssurance.startDateString)
}

const getClaimStatusBasedOnFeatureAssuranceRules = async (species, herdId, previousClaims) => {
  const hasClaimedForMultipleHerdsForSpecies = previousClaims.some(c => c.typeOfLivestock === species && c.herdId !== herdId)

  if (hasClaimedForMultipleHerdsForSpecies) {
    // TODO BH worth logging?
    return applicationStatus.inCheck
  }

  return await getClaimStatusBasedOnRatio()
}
