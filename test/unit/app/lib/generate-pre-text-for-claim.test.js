const generateClaimPreText = require('../../../../app/lib/generate-pre-text-for-claim')
const { getReviewType } = require('../../../../app/lib/get-review-type')
describe('generate pretext for claim', () => {
  afterAll(() => {
    jest.clearAllMocks()
  })
  test('generateClaimPreText should return "RE" for review', () => {
    const type = 'R'
    const typeOfLiveStock = 'Beef Cattle'

    const isReviewResult = getReviewType(type)
    generateClaimPreText(type, typeOfLiveStock)

    expect(generateClaimPreText(type, typeOfLiveStock)).toMatch('REBC')
    expect(isReviewResult).toEqual({ isReview: true, isEndemicsFollowUp: false })
  })
  test('check the value of getReviewType', () => {
    const type = 'R'
    const reviewOrFollowUpValue = getReviewType(type)
    expect(reviewOrFollowUpValue).toEqual({ isReview: true, isEndemicsFollowUp: false })
  })
  test('return RE for review when type is R', () => {
    const type = 'R'
    const reviewOrFollowUp = getReviewType(type)
    const reviewOrFollowUpValue = reviewOrFollowUp?.isReview === true ? 'RE' : 'FU'

    expect(reviewOrFollowUp).toEqual({ isReview: true, isEndemicsFollowUp: false })
    expect(reviewOrFollowUpValue).toMatch('RE')
  })
  test('return undefined for review when type is R', () => {
    const reviewOrFollowUp = undefined
    const reviewOrFollowUpValue = reviewOrFollowUp?.isReview === true ? 'RE' : 'FU'

    expect(reviewOrFollowUp).toBeUndefined()
    expect(reviewOrFollowUpValue).toMatch('FU')
  })

  test.each([
    { type: 'R', typeOfLiveStock: 'InvalidType', expected: 'Invalid livestock type' },
    { type: 'E', typeOfLiveStock: 'InvalidType', expected: 'Invalid livestock type' },
    { type: 'R', typeOfLiveStock: 'Beef', expected: 'REBC' },
    { type: 'E', typeOfLiveStock: 'Beef', expected: 'FUBC' },
    { type: 'R', typeOfLiveStock: 'Beef Cattle', expected: 'REBC' },
    { type: 'E', typeOfLiveStock: 'Beef Cattle', expected: 'FUBC' },
    { type: 'R', typeOfLiveStock: 'Dairy', expected: 'REDC' },
    { type: 'E', typeOfLiveStock: 'Dairy', expected: 'FUDC' },
    { type: 'R', typeOfLiveStock: 'Dairy Cattle', expected: 'REDC' },
    { type: 'E', typeOfLiveStock: 'Dairy Cattle', expected: 'FUDC' },
    { type: 'R', typeOfLiveStock: 'Pig', expected: 'REPI' },
    { type: 'E', typeOfLiveStock: 'Pig', expected: 'FUPI' },
    { type: 'R', typeOfLiveStock: 'Sheep', expected: 'RESH' },
    { type: 'E', typeOfLiveStock: 'Sheep', expected: 'FUSH' }
  ])('should return $expected for type $type and livestock type $typeOfLiveStock', ({ type, typeOfLiveStock, expected }) => {
    expect(generateClaimPreText(type, typeOfLiveStock)).toMatch(expected)
  })
  test('generateClaimPreText should return "Invalid livestock type" for invalid livestock type', () => {
    expect(generateClaimPreText('RE', 'InvalidType')).toBe('Invalid livestock type')
  })
})
