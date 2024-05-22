const { getReviewType } = require('../../../../app/lib/get-review-type')
const { claimType } = require('../../../../app/constants/claim')

describe('getReviewType', () => {
  let typeOfReview
  test('returns correct value for Review claim type', () => {
    typeOfReview = claimType.review
    const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)

    expect(isReview).toBe(true)
    expect(isEndemicsFollowUp).toBe(false)
  })

  test('returns correct value for Endemics Follow-up clam type', () => {
    typeOfReview = claimType.endemics
    const { isReview, isEndemicsFollowUp } = getReviewType(typeOfReview)

    expect(isReview).toBe(false)
    expect(isEndemicsFollowUp).toBe(true)
  })
})
