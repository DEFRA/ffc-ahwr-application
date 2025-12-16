import { getBlob } from '../storage/getBlob.js'
import { livestockTypes, claimType as claimTypeConstant, testResults, piHunt as piHuntMap, piHuntAllAnimals as piHuntAllAnimalsMap } from './../constants/index.js'
import { isVisitDateAfterPIHuntAndDairyGoLive, isPigsAndPaymentsUserJourney } from './context-helper.js'

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
  const { typeOfLivestock, reviewTestResults, piHunt, piHuntAllAnimals, dateOfVisit } = data

  if (isVisitDateAfterPIHuntAndDairyGoLive(dateOfVisit)) {
    return getPiHuntValue(reviewTestResults, piHunt, piHuntAllAnimals, pricesConfig, claimType, typeOfLivestock)
  }

  return getNonPiHuntValue(reviewTestResults, pricesConfig, claimType, typeOfLivestock)
}

const isBeefOrDairyFollowUp = (type, typeOfLivestock) => {
  const { beef, dairy } = livestockTypes
  const { endemics } = claimTypeConstant

  return [beef, dairy].includes(typeOfLivestock) && type === endemics
}

export const getAmount = async (payload) => {
  const { review } = claimTypeConstant
  const { type, data } = payload
  const { typeOfLivestock, dateOfVisit } = data
  const typeOfClaim = type === review ? 'review' : 'followUp'

  const pricesConfigFilename = isPigsAndPaymentsUserJourney(dateOfVisit) ? 'claim-prices-config-20260122.json' : 'claim-prices-config.json'
  const pricesConfig = await getBlob(pricesConfigFilename)

  if (isBeefOrDairyFollowUp(type, typeOfLivestock)) {
    return getBeefDairyAmount(data, pricesConfig, typeOfClaim)
  }
  return pricesConfig[typeOfClaim][typeOfLivestock].value
}
