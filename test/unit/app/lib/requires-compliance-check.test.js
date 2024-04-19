const mockGetAllClaimedApplications = jest.fn()
const mockGetAllClaimedClaims = jest.fn()

jest.mock('../../../../app/repositories/application-repository', () => ({
  getAllClaimedApplications: mockGetAllClaimedApplications
}))
jest.mock('../../../../app/repositories/claim-repository', () => ({
  getAllClaimedClaims: mockGetAllClaimedClaims
}))

describe('Test requires compliance check', () => {
  jest.mock('../../../../app/config', () => ({ ...jest.requireActual('../../../../app/config'), compliance: { complianceCheckRatio: 2 } }))
  test.each([
    { claimOrApplication: 'application', expectedStatusId: 5, totalClaimedApplicationsOrClaims: 1 },
    { claimOrApplication: 'claim', expectedStatusId: 5, totalClaimedApplicationsOrClaims: 1 }
  ])('validate compliance check for $claimOrApplication', async ({ claimOrApplication, expectedStatusId, totalClaimedApplicationsOrClaims }) => {
    const requiresComplianceCheck = require('../../../../app/lib/requires-compliance-check')
    if (claimOrApplication === 'application') {
      mockGetAllClaimedApplications.mockResolvedValue(totalClaimedApplicationsOrClaims)
    } else {
      mockGetAllClaimedClaims.mockResolvedValue(totalClaimedApplicationsOrClaims)
    }

    const result = await requiresComplianceCheck(claimOrApplication)

    if (claimOrApplication === 'application') {
      expect(mockGetAllClaimedApplications).toHaveBeenCalledTimes(1)
    } else {
      expect(mockGetAllClaimedClaims).toHaveBeenCalledTimes(1)
    }
    expect(result.statusId).toBe(expectedStatusId)
    jest.clearAllMocks()
  })
  test.each([
    { claimOrApplication: 'application', expectedStatusId: 11, totalClaimedApplicationsOrClaims: 2 },
    { claimOrApplication: 'claim', expectedStatusId: 11, totalClaimedApplicationsOrClaims: 2 }
  ])('validate compliance check for $claimOrApplication', async ({ claimOrApplication, expectedStatusId, totalClaimedApplicationsOrClaims }) => {
    const requiresComplianceCheck = require('../../../../app/lib/requires-compliance-check')
    if (claimOrApplication === 'application') {
      mockGetAllClaimedApplications.mockResolvedValue(totalClaimedApplicationsOrClaims)
    } else {
      mockGetAllClaimedClaims.mockResolvedValue(totalClaimedApplicationsOrClaims)
    }

    const result = await requiresComplianceCheck(claimOrApplication)

    if (claimOrApplication === 'application') {
      expect(mockGetAllClaimedApplications).toHaveBeenCalledTimes(1)
    } else {
      expect(mockGetAllClaimedClaims).toHaveBeenCalledTimes(1)
    }
    expect(result.statusId).toBe(expectedStatusId)
  })
})
