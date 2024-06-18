const { livestockTypes } = require('./../constants/claim')

const getAmount = (typeOfLivestock, testResults, pricesConfig, isReview, isEndemics) => {
  console.log('getAmount:', 'typeOfLivestock', typeOfLivestock, 'testResults', testResults, 'pricesConfig', pricesConfig, 'isReview', isReview, 'isEndemics', isEndemics)
  const claimType = isReview ? 'review' : 'followUp'

  if ((typeOfLivestock === livestockTypes.beef || typeOfLivestock === livestockTypes.dairy) && testResults && isEndemics) {
    return pricesConfig[claimType][typeOfLivestock].value[testResults]
  } else {
    return pricesConfig[claimType][typeOfLivestock].value
  }
}

module.exports = {
  getAmount
}
