import { getBlob } from '../storage/getBlob.js'
import { config } from '../config/index.js'
import { livestockTypes, claimType, testResults, piHunt as piHuntMap, piHuntAllAnimals as piHuntAllAnimalsMap } from './../constants/index.js'

const getPiHuntValue = (reviewTestResults, piHunt, piHuntAllAnimals, pricesConfig, claimType, typeOfLivestock) => {
  const optionalPiHuntValue = (piHunt === piHuntMap.yes && piHuntAllAnimals === piHuntAllAnimalsMap.yes) ? 'yesPiHunt' : 'noPiHunt'

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
    return getBeefDairyAmount(data, pricesConfig, typeOfClaim)
  }

  return pricesConfig[typeOfClaim][typeOfLivestock].value
}
