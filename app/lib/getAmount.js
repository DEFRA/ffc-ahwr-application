const { livestockTypes } = require('./../constants/claim')

const getAmount = (typeOfLivestock, testResults, pricesConfig) => {
  if ((typeOfLivestock === livestockTypes.beef || typeOfLivestock === livestockTypes.dairy) && testResults) {
    return String(pricesConfig[typeOfLivestock].value[testResults])
  } else {
    return String(pricesConfig[typeOfLivestock].value)
  }
}

module.exports = {
  getAmount
}
