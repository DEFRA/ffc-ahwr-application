const mockGetAllClaimedApplications = jest.fn()
jest.mock('../../../../app/repositories/application-repository', () => ({
  getAllClaimedApplications: mockGetAllClaimedApplications
}))

describe('Test requires compliance check', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })
  test.each([
    { complianceCheckRatio: 1, expectedStatusId: 5, totalClaimedApplications: 5 }, // in check,
    { complianceCheckRatio: 5, expectedStatusId: 9, totalClaimedApplications: 3 }, // ready to pay
    { complianceCheckRatio: 0, expectedStatusId: 9, totalClaimedApplications: 3 }, // ready to pay - compliance checks off
    { complianceCheckRatio: 2, expectedStatusId: 5, totalClaimedApplications: 9 }, // in check
    { complianceCheckRatio: 3, expectedStatusId: 5, totalClaimedApplications: 8 }, // in check
    { complianceCheckRatio: 3, expectedStatusId: 9, totalClaimedApplications: 27 } // ready to pay
  ])('validate compliance check', async ({ complianceCheckRatio, expectedStatusId, totalClaimedApplications }) => {
    const requiresComplianceCheck = require('../../../../app/lib/requires-compliance-check')
    mockGetAllClaimedApplications.mockResolvedValueOnce(totalClaimedApplications)
    const result = await requiresComplianceCheck([5, 9, 10], complianceCheckRatio)
    expect(mockGetAllClaimedApplications).toBeCalledTimes(1)
    expect(result.statusId).toBe(expectedStatusId)
  })
})
