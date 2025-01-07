import { requiresComplianceCheck } from '../../../../app/lib/requires-compliance-check'
import { getAllClaimedApplications } from '../../../../app/repositories/application-repository'
import { getAllClaimedClaims } from '../../../../app/repositories/claim-repository'

jest.mock('../../../../app/repositories/application-repository')
jest.mock('../../../../app/repositories/claim-repository')

const mockGetAllClaimedApplications = jest.fn().mockResolvedValue(1)
const mockGetAllClaimedClaims = jest.fn().mockResolvedValue(1)

getAllClaimedApplications.mockImplementation(mockGetAllClaimedApplications)
getAllClaimedClaims.mockImplementation(mockGetAllClaimedClaims)

describe('Test requires compliance check', () => {
  afterEach(() => jest.clearAllMocks())

  test.each([
    { claimOrApplication: 'application', expectedStatusId: 5 },
    { claimOrApplication: 'claim', expectedStatusId: 11 }
  ])('validate compliance check for $claimOrApplication', async ({ claimOrApplication, expectedStatusId }) => {
    const result = await requiresComplianceCheck(claimOrApplication)

    if (claimOrApplication === 'application') {
      expect(mockGetAllClaimedApplications).toHaveBeenCalledTimes(1)
    } else {
      expect(mockGetAllClaimedClaims).toHaveBeenCalledTimes(1)
    }

    expect(result.statusId).toBe(expectedStatusId)
  })
})
