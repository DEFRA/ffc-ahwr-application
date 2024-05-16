const { getReviewType } = require('./get-review-type')
/**
 *
 * 1st 2 characters denote review or follow up: RE/FU
 * 2nd 2 characters denote species: BC/DC/PI/SH
 * 8 random numbers
 * Eg for Review (pig) -  REPI-6844-3029
 * Eg for Follow up (Beef Cattle) - FUBC-7933-2138
 */
module.exports = (type, typeOfLiveStock) => {
  const species = ['BC', 'DC', 'PI', 'SH']
  const { isReview } = getReviewType(type) || {}

  const reviewOrFollowUpValue = isReview === true ? 'RE' : 'FU'

  switch (typeOfLiveStock.toLowerCase()) {
    case 'beef':
    case 'beef cattle':
      return reviewOrFollowUpValue + species[0]
    case 'dairy':
    case 'dairy cattle':
      return reviewOrFollowUpValue + species[1]
    case 'pig':
      return reviewOrFollowUpValue + species[2]
    case 'sheep':
      return reviewOrFollowUpValue + species[3]
    default:
      return 'Invalid livestock type'
  }
}
