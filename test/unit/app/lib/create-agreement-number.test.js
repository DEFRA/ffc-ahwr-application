const createAgreementNumber = require('../../../../app/lib/create-agreement-number')
const createReference = require('../../../../app/lib/create-reference')
const { endemics } = require('../../../../app/config')

jest.mock('../../../../app/lib/create-reference')

describe('create agreement number', () => {
  const data = { id: 'MOCK-ID12' }
  endemics.enabled = true

  afterAll(() => {
    jest.clearAllMocks()
  })

  test('should return a reference with the correct prefix for an application', () => {
    endemics.enabled = false
    const journey = 'apply'
    const data = { id: 'MOCK-ID12' }

    const mockCreateReference = jest.mocked(createReference).mockReturnValue('AHWR-MOCK-ID12')
    mockCreateReference(data.id)
    const result = createAgreementNumber(journey, data)

    expect(endemics.enabled).toBe(false)
    expect(mockCreateReference).toHaveBeenCalled()
    expect(result).toMatch('AHWR-MOCK-ID12')
  })

  describe('endemics apply ', () => {
    test('should return a reference with the correct prefix for an application', () => {
      endemics.enabled = true
      const journey = 'apply'

      const mockJourneyPreText = jest.fn().mockReturnValue('IAHW')
      const mockCreateReference = jest.mocked(createReference).mockReturnValue('AHWR-MOCK-ID12')
      const mockReplacePrefix = jest.fn().mockReturnValue('IAHW-MOCK-ID12')

      mockJourneyPreText(journey, data)
      mockCreateReference(data.id)
      mockReplacePrefix('AHWR-MOCK-ID12', 'IAHW')
      const result = createAgreementNumber(journey, data)

      expect(endemics.enabled).toBe(true)
      expect(mockCreateReference).toHaveBeenCalled()
      expect(mockJourneyPreText).toHaveBeenCalledTimes(1)
      expect(mockReplacePrefix).toHaveBeenCalledTimes(1)
      expect(result).toMatch('IAHW-MOCK-ID12')
    })
  })

  describe(' endemics claim journey ', () => {
    test('should return a reference with the correct prefix for a claim', () => {
      endemics.enabled = true
      const journey = 'claim'
      const data = { id: '', type: 'F', typeOfLivestock: 'beef' }
      const result = createAgreementNumber(journey, data)

      expect(endemics.enabled).toBe(true)
      expect(result).toMatch('FUBC-MOCK-ID12')
    })
    test('should return a reference with the correct prefix for a claim with no typeOfLivestock', () => {
      endemics.enabled = true
      const journey = 'claim'
      const data = { id: 'MOCK-ID12', type: 'R', typeOfLivestock: '' }

      const result = createAgreementNumber(journey, data)

      expect(endemics.enabled).toBe(true)
      expect(result).toMatch(/Invalid livestock type/i)
    })
    test('should return a reference with the correct prefix for a claim with no data', () => {
      endemics.enabled = true
      const journey = 'claim'
      const data = { id: 'MOCK-ID12', type: 'R', typeOfLivestock: 'beef' }

      const result = createAgreementNumber(journey, data)

      expect(endemics.enabled).toBe(true)
      expect(result).toMatch('REBC-MOCK-ID12')
    })
    test('should return a reference with the correct prefix for a claim with no data', () => {
      endemics.enabled = true
      const journey = 'claim'
      const data = { }

      const result = createAgreementNumber(journey, data)

      expect(endemics.enabled).toBe(true)
      expect(result).toMatch(/Invalid livestock type/i)
    })
    test('should return a reference with the correct prefix for a claim with no data', () => {
      endemics.enabled = true
      const journey = 'claim'
      const data = { id: 'MOCK-ID12' }

      const result = createAgreementNumber(journey, data)

      expect(endemics.enabled).toBe(true)
      expect(result).toMatch(/Invalid livestock type/i)
    })
  })
})
