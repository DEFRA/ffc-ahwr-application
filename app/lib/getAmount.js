import { getBlob } from '../storage/getBlob.js'
import { config } from '../config/index.js'
import { livestockTypes, claimType, testResults, piHunt as piHuntMap, piHuntAllAnimals as piHuntAllAnimalsMap } from './../constants/index.js'

const claimPricesConfig = {
  review: {
    beef: {
      value: 522,
      code: 'AHWR-Beef'
    },
    dairy: {
      value: 372,
      code: 'AHWR-Dairy'
    },
    pigs: {
      value: 557,
      code: 'AHWR-Pigs'
    },
    sheep: {
      value: 436,
      code: 'AHWR-Sheep'
    }
  },
  followUp: {
    beef: {
      value: {
        positive: 837,
        negative: {
          noPiHunt: 215,
          yesPiHunt: 837
        }
      },
      code: 'AHWR-Beef'
    },
    dairy: {
      value: {
        positive: 1714,
        negative: {
          noPiHunt: 215,
          yesPiHunt: 1714
        }
      },
      code: 'AHWR-Dairy'
    },
    pigs: {
      value: 923,
      code: 'AHWR-Pigs'
    },
    sheep: {
      value: 639,
      code: 'AHWR-Sheep'
    }
  }
}

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

  let pricesConfig
  if (process.env.NODE_ENV === 'development') {
    pricesConfig = claimPricesConfig 
  } else {
    pricesConfig = await getBlob('claim-prices-config.json')
  }
  
  const { typeOfLivestock } = data

  if ([livestockTypes.beef, livestockTypes.dairy].includes(typeOfLivestock) && data.reviewTestResults && type === claimType.endemics) {
    return getBeefDairyAmount(data, pricesConfig, typeOfClaim)
  }

  return pricesConfig[typeOfClaim][typeOfLivestock].value
}
