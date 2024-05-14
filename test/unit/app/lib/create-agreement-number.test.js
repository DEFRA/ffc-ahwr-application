const createAgreementNumber = require('../../../../app/lib/create-agreement-number')
describe('createAgreementNumber', () => {
  describe('fourDigitRandomNumberGenerator', () => {
    test('fourDigitRandomNumberGenerator should return a four-digit random number between 1000 and 9999', () => {
      const mockgetRandomBytes = jest.fn().mockReturnValueOnce(Buffer.from([0x00, 0x00, 0x00, 0x00]))
      const mockconvertToUint32Array = jest.fn().mockReturnValueOnce(new Uint32Array([0x00]))
      const mocksetValueInRange = jest.fn().mockReturnValueOnce(1000)

      const mockfourDigitRandomNumberGenerator = () => {
        const randomBytes = mockgetRandomBytes(4)
        const randomUint32Array = mockconvertToUint32Array(randomBytes)
        return mocksetValueInRange(randomUint32Array[0], 1000, 9999)
      }
      const fourDigitRandomNumberGenerator = mockfourDigitRandomNumberGenerator()
      createAgreementNumber(mockfourDigitRandomNumberGenerator)

      expect(mockgetRandomBytes).toHaveBeenCalledTimes(1)
      expect(mockconvertToUint32Array).toHaveBeenCalledTimes(1)
      expect(mocksetValueInRange).toHaveBeenCalledTimes(1)
      expect(fourDigitRandomNumberGenerator).toBe(1000)
      expect(fourDigitRandomNumberGenerator).toBeGreaterThanOrEqual(1000)
      expect(fourDigitRandomNumberGenerator).toBeLessThanOrEqual(9999)
    })
  })
  test('return random 14 digit on every call', () => {
    const agreementNumber = createAgreementNumber()
    expect(agreementNumber).toHaveLength(14)
  })

  test('return  14 digit alpha numeric number Eg IAHW-9154-8827', () => {
    const mockfourDigitRandomNumberGenerator = jest.fn().mockReturnValueOnce(1234).mockReturnValueOnce(2345)
    const agreementNumber = createAgreementNumber('IAHW', mockfourDigitRandomNumberGenerator)

    expect(agreementNumber).toMatch(/IAHW-1234-2345/i)
    expect(agreementNumber).toHaveLength(14)
  })
})
