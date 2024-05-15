const generateClaimPreText = require('../../../../app/lib/generate-pre-text-for-claim')

describe('generate pretext for claim', () => {
  test('generateClaimPreText should return "RE" for review', () => {
    expect(generateClaimPreText({ isReview: true }, 'beef Cattle')).toBe('REBC')
  })

  test('generateClaimPreText should return "FU" for follow up', () => {
    expect(generateClaimPreText({ isReview: false }, 'Dairy Cattle')).toBe('FUDC')
  })
  test('generateClaimPreText should return the correct claim pre-text for valid inputs', () => {
    expect(generateClaimPreText({ isReview: true }, 'Pig')).toBe('REPI')

    expect(generateClaimPreText({ isReview: false }, 'Beef Cattle')).toBe('FUBC')
    expect(generateClaimPreText({ isReview: false }, 'Beef')).toBe('FUBC')

    expect(generateClaimPreText({ isReview: true }, 'sheep')).toBe('RESH')

    expect(generateClaimPreText({ isReview: false }, 'Dairy Cattle')).toBe('FUDC')
    expect(generateClaimPreText({ isReview: false }, 'Dairy')).toBe('FUDC')
  })
  test('generateClaimPreText should return "Invalid livestock type" for invalid livestock type', () => {
    expect(generateClaimPreText('RE', 'InvalidType')).toBe('Invalid livestock type')
  })
})
