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
    complianceCheckRatio: '5',
    featureAssurance: {
      enabled: false,
      startDate: undefined
    }
  }
}))

const mockLogger = { info: jest.fn() }

const mockGetAndIncrementComplianceCheckCount = getAndIncrementComplianceCheckCount

describe('Test generateClaimStatus', () => {
  afterEach(() => jest.clearAllMocks())

  test('should return inCheck when compliance checks are enabled and ratio matches', async () => {
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(5)

    const visitDate = '2025-06-01'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(mockGetAndIncrementComplianceCheckCount).toHaveBeenCalledTimes(1)
    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return onHold when compliance checks are disabled (ratio <= 0)', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '0'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(10)

    const visitDate = '2025-06-01'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(result).toBe(applicationStatus.onHold)
    expect(mockGetAndIncrementComplianceCheckCount).not.toHaveBeenCalled()
  })

  test('should return onHold when compliance checks are disabled (negative ratio)', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '-1'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(5)

    const visitDate = '2025-06-01'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(result).toBe(applicationStatus.onHold)
    expect(mockGetAndIncrementComplianceCheckCount).not.toHaveBeenCalled()
  })

  test('should return onHold when claim count does not match ratio interval', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(6)

    const visitDate = '2025-06-01'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return inCheck when claim count matches ratio interval', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '3'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(3)

    const visitDate = '2025-06-01'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return inCheck when claim count is multiple of ratio', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(10)

    const visitDate = '2025-06-01'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return onHold when claim count is not multiple of ratio', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '3'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-01'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when feature assurance on but visit date before assurance start', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = true
    config.featureAssurance.startDate = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-25'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when visit date after assurance start but feature assurance off', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = false
    config.featureAssurance.startDate = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-27'
    const herdId = 'fake-herd-id'
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when feature assurance and no previous claims', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = true
    config.featureAssurance.startDate = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-27'
    const herdId = 'fake-herd-id'
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when feature assurance and previous claims but not for sheep', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = true
    config.featureAssurance.startDate = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-27'
    const herdId = 'fake-herd-id'
    const previousClaims = [{ data: { typeOfLivestock: 'sheep', herdId }, applicationReference: 'IAHW-FAK3-FAK3' }]
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when feature assurance and previous claim but for same herd/flock', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = true
    config.featureAssurance.startDate = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-27'
    const herdId = 'fake-herd-id'
    const previousClaims = [{ data: { typeOfLivestock: 'sheep', herdId }, applicationReference: 'IAHW-FAK3-FAK3' }]
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return inCheck when feature assurance and previous claim for different herd/flock', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = true
    config.featureAssurance.startDate = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-27'
    const herdId = 'fake-herd-id-2'
    const previousClaims = [{ data: { typeOfLivestock: 'sheep', herdId: 'fake-herd-id-1' }, applicationReference: 'IAHW-FAK3-FAK3' }]
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(mockLogger.info).toHaveBeenCalledWith('Agreement \'IAHW-FAK3-FAK3\' had a claim set to inCheck due to feature assurance rules')
    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return inCheck when feature assurance and previous claim for same and different herd/flock', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = true
    config.featureAssurance.startDate = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-27'
    const herdId = 'fake-herd-id-2'
    const previousClaims = [{ data: { typeOfLivestock: 'sheep', herdId: 'fake-herd-id-1' }, applicationReference: 'IAHW-FAK3-FAK3' }, { typeOfLivestock: 'sheep', herdId: 'fake-herd-id-2', applicationReference: 'IAHW-FAK3-FAK3' }]
    const result = await generateClaimStatus(visitDate, herdId, previousClaims, mockLogger)

    expect(mockLogger.info).toHaveBeenCalledWith('Agreement \'IAHW-FAK3-FAK3\' had a claim set to inCheck due to feature assurance rules')
    expect(result).toBe(applicationStatus.inCheck)
  })
})
