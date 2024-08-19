const { getBlob } = require('../storage')
const { optionalPIHunt: { enabled: optionalPIHuntEnabled } } = require('../config')
const { livestockTypes, claimType: claimTypeValues, testResults: testResultsValues, piHunt: piHuntValues, piHuntAllAnimals: piHuntAllAnimalsValues } = require('./../constants/claim')

const getAmount = async (payload) => {
  const { type, data } = payload
  const claimType = type === claimTypeValues.review ? 'review' : 'followUp'
  const pricesConfig = await getBlob('claim-prices-config.json')
  const { typeOfLivestock, testResults, piHunt, piHuntAllAnimals } = data

  if ((typeOfLivestock === livestockTypes.beef || typeOfLivestock === livestockTypes.dairy) && testResults && type === claimTypeValues.endemics) {
    if (optionalPIHuntEnabled) {
      const optionalPiHunt = piHunt === piHuntValues.yes && piHuntAllAnimals === piHuntAllAnimalsValues.yes ? 'yesPiHunt' : 'noPiHunt'
      return pricesConfig[claimType][typeOfLivestock].value[testResults][optionalPiHunt]
    } else {
      if (testResults === testResultsValues.positive) {
        return pricesConfig[claimType][typeOfLivestock].value[testResults]
      } else {
        // when the flag is off there is no option, if negative they can't have done a pi hunt
        return pricesConfig[claimType][typeOfLivestock].value[testResults]['noPiHunt']
      }
    }
  } else {
    return pricesConfig[claimType][typeOfLivestock].value
  }
}

module.exports = {
  getAmount
}
