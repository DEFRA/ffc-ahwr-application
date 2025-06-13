import { buildData } from '../../../../app/data/index.js'
import { getAndIncrementComplianceCheckCount } from '../../../../app/repositories/compliance-check-count.js'

jest.mock('../../../../app/data/index.js', () => ({
  buildData: {
    models: {
      complianceCheckCount: {
        findOne: jest.fn(),
        increment: jest.fn()
      }
    }
  }
}))

describe('Compliance Check Count Repository', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getAndIncrementComplianceCheckCount', () => {
    it('should increment and return the compliance check count when record exists', async () => {
      const mockCount = 5
      const mockIncrement = jest.fn().mockResolvedValue({
        dataValues: { count: mockCount }
      })
      buildData.models.complianceCheckCount.findOne.mockResolvedValue({
        increment: mockIncrement
      })

      const result = await getAndIncrementComplianceCheckCount()

      expect(buildData.models.complianceCheckCount.findOne).toHaveBeenCalledWith({
        where: { id: 1 }
      })
      expect(mockIncrement).toHaveBeenCalledWith('count')
      expect(result).toBe(mockCount)
    })

    it('should throw an error when compliance check count record is not found', async () => {
      buildData.models.complianceCheckCount.findOne.mockResolvedValue(null)

      await expect(getAndIncrementComplianceCheckCount()).rejects.toThrow('Compliance check count not found')
      expect(buildData.models.complianceCheckCount.findOne).toHaveBeenCalledWith({
        where: { id: 1 }
      })
    })
  })
})
