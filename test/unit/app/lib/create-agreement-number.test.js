const createAgreementNumber = require('../../../../app/lib/create-agreement-number')
const createReference = require('../../../../app/lib/create-reference')
jest.mock('../../../../app/lib/create-reference')
describe('create agreement number', () => {
  const data = { id: 'MOCK-ID12' }
  afterAll(() => {
    jest.clearAllMocks()
  })

  describe('endemics apply ', () => {
    test('should return a reference with the correct prefix for an application', () => {
      const mockEndemics = { enabled: true }
      const journey = 'apply'

      const mockJourneyPreText = jest.fn().mockReturnValue('IAHW')
      const mockCreateReference = jest.mocked(createReference).mockReturnValue('AHWR-MOCK-ID12')
      const mockReplacePrefix = jest.fn().mockReturnValue('IAHW-MOCK-ID12')

      mockJourneyPreText(journey, data)
      mockCreateReference(data.id)
      mockReplacePrefix('AHWR-MOCK-ID12', 'IAHW')
      const result = createAgreementNumber(journey, data)

      expect(mockEndemics.enabled).toBe(true)
      expect(mockCreateReference).toHaveBeenCalled()
      expect(mockJourneyPreText).toHaveBeenCalledTimes(1)
      expect(mockReplacePrefix).toHaveBeenCalledTimes(1)
      expect(result).toMatch('IAHW-MOCK-ID12')
    })
  })
  describe(' endemics claim journey ', () => {
    test('should return a reference with the correct prefix for a claim', () => {
      const journey = 'claim'
      const data = { id: '', type: 'F', typeOfLivestock: 'beef' }
      const result = createAgreementNumber(journey, data)
      expect(result).toMatch('FUBC-MOCK-ID12')
    })
    test('should return a reference with the correct prefix for a claim with no typeOfLivestock', () => {
      const journey = 'claim'
      const data = { id: 'MOCK-ID12', type: 'R', typeOfLivestock: '' }
      const result = createAgreementNumber(journey, data)
      expect(result).toMatch(/Invalid livestock type/i)
    })
    test('should return a reference with the correct prefix for a claim with no data', () => {
      const journey = 'claim'
      const data = { id: 'MOCK-ID12', type: 'R', typeOfLivestock: 'beef' }
      const result = createAgreementNumber(journey, data)
      expect(result).toMatch('REBC-MOCK-ID12')
    })
    test('should return a reference with the correct prefix for a claim with no data', () => {
      const mockEndemics = { enabled: true }
      const journey = 'claim'
      const data = { }
      const result = createAgreementNumber(journey, data)

      expect(mockEndemics.enabled).toBe(true)
      expect(result).toMatch(/Invalid livestock type/i)
    })
    test('should return a reference with the correct prefix for a claim with no data', () => {
      const mockEndemics = { enabled: true }
      const journey = 'claim'
      const data = { id: 'MOCK-ID12' }
      const result = createAgreementNumber(journey, data)
      expect(mockEndemics.enabled).toBe(true)
      expect(result).toMatch(/Invalid livestock type/i)
    })
  })
})
