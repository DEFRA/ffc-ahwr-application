import { getBlob } from '../storage/getBlob'
import { config } from '../config'
import { livestockTypes, claimType, testResults } from './../constants'

const getPiHuntValue = (reviewTestResults, piHunt, piHuntAllAnimals, pricesConfig, claimType, typeOfLivestock) => {
  const optionalPiHuntValue = (piHunt === piHunt.yes && piHuntAllAnimals === piHuntAllAnimals.yes) ? 'yesPiHunt' : 'noPiHunt'

  if (reviewTestResults === testResults.positive) {
    return pricesConfig[claimType][typeOfLivestock].value[reviewTestResults]
  }

  return pricesConfig[claimType][typeOfLivestock].value[reviewTestResults][optionalPiHuntValue]
}

const getNonPiHuntValue = (reviewTestResults, pricesConfig, claimType, typeOfLivestock) => {
  if (reviewTestResults === testResults.positive) {
    return pricesConfig[claimType][typeOfLivestock].value[reviewTestResults]
  }

  return pricesConfig[claimType][typeOfLivestock].value[reviewTestResults].noPiHunt
}

const getBeefDairyAmount = (data, pricesConfig, claimType) => {
  const { typeOfLivestock, reviewTestResults, piHunt, piHuntAllAnimals } = data

  if (config.optionalPIHunt.enabled) {
    return getPiHuntValue(reviewTestResults, piHunt, piHuntAllAnimals, pricesConfig, claimType, typeOfLivestock)
  }

  return getNonPiHuntValue(reviewTestResults, pricesConfig, claimType, typeOfLivestock)
}

export const getAmount = async (payload) => {
  const { type, data } = payload
  const typeOfClaim = type === claimType.review ? 'review' : 'followUp'
  const pricesConfig = await getBlob('claim-prices-config.json')
  const { typeOfLivestock } = data

  if ([livestockTypes.beef, livestockTypes.dairy].includes(typeOfLivestock) && data.reviewTestResults && type === claimType.endemics) {
    return getBeefDairyAmount(data, pricesConfig, claimType)
  }

  return pricesConfig[typeOfClaim][typeOfLivestock].value
}
