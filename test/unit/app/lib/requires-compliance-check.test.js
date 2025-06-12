import { generateClaimStatus } from '../../../../app/lib/requires-compliance-check'
import { getAndIncrementComplianceCheckCount } from '../../../../app/repositories/compliance-check-count'
import { applicationStatus } from '../../../../app/constants/index'

jest.mock('../../../../app/constants/index', () => ({
  applicationStatus: {
    inCheck: 5,
    onHold: 11
  }
}))

jest.mock('../../../../app/repositories/compliance-check-count', () => ({
  getAndIncrementComplianceCheckCount: jest.fn()
}))
jest.mock('../../../../app/config/index', () => ({
  config: {
    complianceCheckRatio: '5'
  }
}))

const mockGetAndIncrementComplianceCheckCount = getAndIncrementComplianceCheckCount

describe('Test generateClaimStatus', () => {
  afterEach(() => jest.clearAllMocks())

  test('should return inCheck when compliance checks are enabled and ratio matches', async () => {
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(5)
    const result = await generateClaimStatus()

    expect(mockGetAndIncrementComplianceCheckCount).toHaveBeenCalledTimes(1)
    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return onHold when compliance checks are disabled (ratio <= 0)', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '0'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(10)

    const result = await generateClaimStatus()

    expect(result).toBe(applicationStatus.onHold)
    expect(mockGetAndIncrementComplianceCheckCount).not.toHaveBeenCalled()
  })

  test('should return onHold when compliance checks are disabled (negative ratio)', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '-1'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(5)

    const result = await generateClaimStatus()

    expect(result).toBe(applicationStatus.onHold)
    expect(mockGetAndIncrementComplianceCheckCount).not.toHaveBeenCalled()
  })

  test('should return onHold when claim count does not match ratio interval', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(6)

    const result = await generateClaimStatus()

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return inCheck when claim count matches ratio interval', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '3'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(3)

    const result = await generateClaimStatus()

    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return inCheck when claim count is multiple of ratio', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(10)

    const result = await generateClaimStatus()

    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return onHold when claim count is not multiple of ratio', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '3'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const result = await generateClaimStatus()

    expect(result).toBe(applicationStatus.onHold)
  })
})
