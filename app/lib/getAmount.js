const { getBlob } = require('../storage')
const { optionalPIHunt } = require('../config')
const { livestockTypes, claimType: claimTypeValues, testResults: testResultsValues, piHunt: piHuntValues, piHuntAllAnimals: piHuntAllAnimalsValues } = require('./../constants/claim')

const getPiHuntValue = (reviewTestResults, piHunt, piHuntAllAnimals, pricesConfig, claimType, typeOfLivestock) => {
  const optionalPiHuntValue = (piHunt === piHuntValues.yes && piHuntAllAnimals === piHuntAllAnimalsValues.yes) ? 'yesPiHunt' : 'noPiHunt'

  if (reviewTestResults === testResultsValues.positive) {
    return pricesConfig[claimType][typeOfLivestock].value[reviewTestResults]
  }

  return pricesConfig[claimType][typeOfLivestock].value[reviewTestResults][optionalPiHuntValue]
}

const getNonPiHuntValue = (reviewTestResults, pricesConfig, claimType, typeOfLivestock) => {
  if (reviewTestResults === testResultsValues.positive) {
    return pricesConfig[claimType][typeOfLivestock].value[reviewTestResults]
  }

  return pricesConfig[claimType][typeOfLivestock].value[reviewTestResults].noPiHunt
}

const getBeefDairyAmount = (data, pricesConfig, claimType) => {
  const { typeOfLivestock, reviewTestResults, piHunt, piHuntAllAnimals } = data

  if (optionalPIHunt.enabled) {
    return getPiHuntValue(reviewTestResults, piHunt, piHuntAllAnimals, pricesConfig, claimType, typeOfLivestock)
  }

  return getNonPiHuntValue(reviewTestResults, pricesConfig, claimType, typeOfLivestock)
}

const getAmount = async (payload) => {
  const { type, data } = payload
  const claimType = type === claimTypeValues.review ? 'review' : 'followUp'
  const pricesConfig = await getBlob('claim-prices-config.json')
  const { typeOfLivestock } = data

  if ((typeOfLivestock === livestockTypes.beef || typeOfLivestock === livestockTypes.dairy) && data.reviewTestResults && type === claimTypeValues.endemics) {
    return getBeefDairyAmount(data, pricesConfig, claimType)
  }

  // not a beef/dairy cattle follow-up
  return pricesConfig[claimType][typeOfLivestock].value
}

module.exports = {
  getAmount
}
