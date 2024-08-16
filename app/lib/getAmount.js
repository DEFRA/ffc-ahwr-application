const { livestockTypes } = require('./../constants/claim')

const getAmount = (typeOfLivestock, testResults, pricesConfig, isReview, isEndemics, optionalPiHunt) => {
  // maybe pass in the full request data instead of specifics so we can get all the piHunt data
  // to check for a valid piHunt we only need to check if they said YES to piHuntAllAnimals
  // we can also move the get request for the prices config to this file as it is only used here
  const claimType = isReview ? 'review' : 'followUp'

  if ((typeOfLivestock === livestockTypes.beef || typeOfLivestock === livestockTypes.dairy) && testResults && isEndemics && optionalPiHunt) {
    if (testResults === 'negative') {
      return pricesConfig[claimType][typeOfLivestock].value[testResults][optionalPiHunt]
    }
    return pricesConfig[claimType][typeOfLivestock].value[testResults]
  } else {
    return pricesConfig[claimType][typeOfLivestock].value
  }
}

module.exports = {
  getAmount
}
