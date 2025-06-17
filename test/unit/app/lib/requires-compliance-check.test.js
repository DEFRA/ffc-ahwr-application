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
      startDateString: undefined
    }
  }
}))

const mockGetAndIncrementComplianceCheckCount = getAndIncrementComplianceCheckCount

describe('Test generateClaimStatus', () => {
  afterEach(() => jest.clearAllMocks())

  test('should return inCheck when compliance checks are enabled and ratio matches', async () => {
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(5)

    const visitDate = '2025-06-01'
    const species = 'sheep'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(mockGetAndIncrementComplianceCheckCount).toHaveBeenCalledTimes(1)
    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return onHold when compliance checks are disabled (ratio <= 0)', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '0'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(10)

    const visitDate = '2025-06-01'
    const species = 'sheep'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(result).toBe(applicationStatus.onHold)
    expect(mockGetAndIncrementComplianceCheckCount).not.toHaveBeenCalled()
  })

  test('should return onHold when compliance checks are disabled (negative ratio)', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '-1'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(5)

    const visitDate = '2025-06-01'
    const species = 'sheep'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(result).toBe(applicationStatus.onHold)
    expect(mockGetAndIncrementComplianceCheckCount).not.toHaveBeenCalled()
  })

  test('should return onHold when claim count does not match ratio interval', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(6)

    const visitDate = '2025-06-01'
    const species = 'sheep'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return inCheck when claim count matches ratio interval', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '3'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(3)

    const visitDate = '2025-06-01'
    const species = 'sheep'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return inCheck when claim count is multiple of ratio', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(10)

    const visitDate = '2025-06-01'
    const species = 'sheep'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return onHold when claim count is not multiple of ratio', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '3'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-01'
    const species = 'sheep'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when feature assurance on but visit date before assurance start', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = true
    config.featureAssurance.startDateString = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-25'
    const species = 'sheep'
    const herdId = undefined
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when visit date after assurance start but feature assurance off', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = false
    config.featureAssurance.startDateString = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-27'
    const species = 'sheep'
    const herdId = 'fake-herd-id'
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when feature assurance and no previous claims', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = true
    config.featureAssurance.startDateString = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-27'
    const species = 'sheep'
    const herdId = 'fake-herd-id'
    const previousClaims = []
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when feature assurance and previous claims but not for sheep', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = true
    config.featureAssurance.startDateString = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-27'
    const species = 'sheep'
    const herdId = 'fake-herd-id'
    const previousClaims = [{ typeOfLivestock: 'beef', herdId }]
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return onHold when feature assurance and previous claim but for same herd/flock', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = true
    config.featureAssurance.startDateString = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-27'
    const species = 'sheep'
    const herdId = 'fake-herd-id'
    const previousClaims = [{ typeOfLivestock: 'sheep', herdId }]
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(result).toBe(applicationStatus.onHold)
  })

  test('should return inCheck when feature assurance and previous claim for different herd/flock', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = true
    config.featureAssurance.startDateString = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-27'
    const species = 'sheep'
    const herdId = 'fake-herd-id-2'
    const previousClaims = [{ typeOfLivestock: 'sheep', herdId: 'fake-herd-id-1' }]
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(result).toBe(applicationStatus.inCheck)
  })

  test('should return inCheck when feature assurance and previous claim for same and different herd/flock', async () => {
    const { config } = require('../../../../app/config/index')
    config.complianceCheckRatio = '5'
    config.featureAssurance.enabled = true
    config.featureAssurance.startDateString = '2025-06-26'
    mockGetAndIncrementComplianceCheckCount.mockResolvedValue(4)

    const visitDate = '2025-06-27'
    const species = 'sheep'
    const herdId = 'fake-herd-id-2'
    const previousClaims = [{ typeOfLivestock: 'sheep', herdId: 'fake-herd-id-1' }, { typeOfLivestock: 'sheep', herdId: 'fake-herd-id-2' }]
    const result = await generateClaimStatus(visitDate, species, herdId, previousClaims)

    expect(result).toBe(applicationStatus.inCheck)
  })

  // BH feature on and visit-date golive then do below, otherwise use today’s logic
  // BH claims filtered by species before below checks
  // BH no NW|OW claims, makes MH claim, then 20%
  // TODO BH no NW claim, but OW claim, makes MH claim, then 20%
  // BH no OW claim, but NW claim, makes MH claim (same-herd=yes), then 20%
  // BH no OW claim, but NW claim, makes MH claim (same-herd=no), then 100%
  // BH no OW claim, but MH claim(s), makes another MH claim (select-herd=any), then 100%
})
