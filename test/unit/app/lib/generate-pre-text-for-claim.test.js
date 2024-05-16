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
  test('check if getReviewType is called and has correct value', () => {
    const type = 'R'
    const typeOfLiveStock = 'Beef Cattle'

    const { isReview } = getReviewType(type) || {}
    generateClaimPreText(type, typeOfLiveStock)

    expect(isReview).toBe(true)
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
