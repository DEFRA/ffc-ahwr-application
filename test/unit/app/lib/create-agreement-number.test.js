const createAgreementNumber = require('../../../../app/lib/create-agreement-number')
describe('fourDigitRandomNumberGenerator', () => {
  test('should generate a four-digit random number', () => {
    const fourDigitRandomNumberGenerator = jest.fn().mockReturnValue(1234)
    const randomNumber = fourDigitRandomNumberGenerator()
    createAgreementNumber()

    expect(randomNumber % 1).toBe(0)
    expect(randomNumber).toBe(1234)
    expect(randomNumber).toBeGreaterThanOrEqual(1000)
    expect(randomNumber).toBeLessThanOrEqual(9999)
  })
  test('generate agreement number', () => {
    const mockfourDigitRandomNumberGenerator = jest.fn().mockReturnValueOnce(1234).mockReturnValueOnce(2345)
    const agreementNumber = createAgreementNumber(mockfourDigitRandomNumberGenerator)
    expect(agreementNumber.length).toBe(14)
    expect(agreementNumber.toString()).toMatch(/IAHW-1234-2345/i)
  })
})
