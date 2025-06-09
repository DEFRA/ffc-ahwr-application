import { requiresComplianceCheck } from '../../../../app/lib/requires-compliance-check'
import { getAllClaimedClaims } from '../../../../app/repositories/claim-repository'
import { applicationStatus } from '../../../../app/constants/index'

jest.mock('../../../../app/constants/index', () => ({
  applicationStatus: {
    inCheck: 5,
    onHold: 11
  }
}))

jest.mock('../../../../app/repositories/claim-repository', () => ({
  getAllClaimedClaims: jest.fn()
}))
jest.mock('../../../../app/config/index', () => ({
  config: {
    complianceCheckRatio: '5'
  }
}))

const mockGetAllClaimedClaims = getAllClaimedClaims

describe('Test requires compliance check', () => {
  afterEach(() => jest.clearAllMocks())

  test('should return inCheck when compliance checks are enabled and ratio matches', async () => {
    mockGetAllClaimedClaims.mockResolvedValue(4)
    const result = await requiresComplianceCheck()

    expect(mockGetAllClaimedClaims).toHaveBeenCalledTimes(1)
    expect(mockGetAllClaimedClaims).toHaveBeenCalledWith([
      applicationStatus.inCheck,
      applicationStatus.readyToPay,
      applicationStatus.rejected,
      applicationStatus.onHold,
      applicationStatus.recommendToPay,
      applicationStatus.recommendToReject
    ])
    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return onHold when compliance checks are disabled (ratio <= 0)', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '0'
    mockGetAllClaimedClaims.mockResolvedValue(10)

    const result = await requiresComplianceCheck()

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when compliance checks are disabled (negative ratio)', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '-1'
    mockGetAllClaimedClaims.mockResolvedValue(5)

    const result = await requiresComplianceCheck()

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when claim count does not match ratio interval', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    mockGetAllClaimedClaims.mockResolvedValue(6)

    const result = await requiresComplianceCheck()

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return inCheck when claim count matches ratio interval', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '3'
    mockGetAllClaimedClaims.mockResolvedValue(2)

    const result = await requiresComplianceCheck()

    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return onHold when no existing claim applications', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    mockGetAllClaimedClaims.mockResolvedValue(0)

    const result = await requiresComplianceCheck()

    expect(result).toBe(applicationStatus.onHold)
  })
})
