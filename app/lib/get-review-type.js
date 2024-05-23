const { claimType } = require('../constants/claim')

const getReviewType = (typeOfReview) => {
  return {
    isReview: typeOfReview === claimType.review,
    isEndemicsFollowUp: typeOfReview === claimType.endemics
  }
}

module.exports = {
  getReviewType
}
