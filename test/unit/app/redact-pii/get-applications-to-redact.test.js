import { getApplicationsToRedact } from '../../../../app/redact-pii/get-applications-to-redact'
import { getFailedApplicationRedact, createApplicationRedact } from '../../../../app/repositories/application-redact-repository'
import { getApplicationsToRedactWithNoPaymentOlderThanThreeYears, getApplicationsToRedactWithRejectedPaymentOlderThanThreeYears, getApplicationsToRedactWithPaymentOlderThanSevenYears } from '../../../../app/repositories/application-repository'

jest.mock('../../../../app/repositories/application-redact-repository')
jest.mock('../../../../app/repositories/application-repository')

describe('get-applications-to-redact', () => {
  const requestedDate = '2025-08-05'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return failed applications when GOT_APPLICATIONS_TO_REDACT is already in status', async () => {
    const failedApplications = [
      { id: 1, status: 'applications-to-redact,documents' }
    ]
    getFailedApplicationRedact.mockResolvedValue(failedApplications)

    const result = await getApplicationsToRedact(requestedDate)

    expect(result).toEqual({
      applicationsToRedact: failedApplications,
      status: ['applications-to-redact', 'documents']
    })
    expect(getApplicationsToRedactWithNoPaymentOlderThanThreeYears).not.toHaveBeenCalled()
    expect(createApplicationRedact).not.toHaveBeenCalled()
  })

  it('should update applications to redact and return new applications when previous attempt failed to update applications', async () => {
    getFailedApplicationRedact.mockResolvedValue()
    getApplicationsToRedactWithNoPaymentOlderThanThreeYears.mockResolvedValue([{ id: 10 }])
    getApplicationsToRedactWithRejectedPaymentOlderThanThreeYears.mockResolvedValue([{ id: 11 }])
    getApplicationsToRedactWithPaymentOlderThanSevenYears.mockResolvedValue([{ id: 12 }])
    createApplicationRedact.mockImplementation(app => Promise.resolve({ ...app }))

    const result = await getApplicationsToRedact(requestedDate)

    expect(getApplicationsToRedactWithNoPaymentOlderThanThreeYears).toHaveBeenCalled()
    expect(getApplicationsToRedactWithRejectedPaymentOlderThanThreeYears).toHaveBeenCalled()
    expect(getApplicationsToRedactWithPaymentOlderThanSevenYears).toHaveBeenCalled()
    expect(createApplicationRedact).toHaveBeenCalledTimes(3)
    expect(result).toEqual({
      applicationsToRedact: [
        { id: 10, requestedDate },
        { id: 11, requestedDate },
        { id: 12, requestedDate }
      ],
      status: ['applications-to-redact']
    })
  })

  it('should return new applications to redact when no previously failed attempts', async () => {
    getFailedApplicationRedact.mockResolvedValue([])
    getApplicationsToRedactWithNoPaymentOlderThanThreeYears.mockResolvedValue([{ id: 10 }])
    getApplicationsToRedactWithRejectedPaymentOlderThanThreeYears.mockResolvedValue([{ id: 11 }])
    getApplicationsToRedactWithPaymentOlderThanSevenYears.mockResolvedValue([{ id: 12 }])
    createApplicationRedact.mockImplementation(app => Promise.resolve(app))

    const result = await getApplicationsToRedact(requestedDate)

    expect(createApplicationRedact).toHaveBeenCalledTimes(3)
    expect(result).toEqual({
      applicationsToRedact: [
        { id: 10, requestedDate },
        { id: 11, requestedDate },
        { id: 12, requestedDate }
      ],
      status: ['applications-to-redact']
    })
  })

  it('should return 0 applications to redact when 0 previously failed attempts and 0 new applications to redact', async () => {
    getFailedApplicationRedact.mockResolvedValue([])
    getApplicationsToRedactWithNoPaymentOlderThanThreeYears.mockResolvedValue([])
    getApplicationsToRedactWithRejectedPaymentOlderThanThreeYears.mockResolvedValue([])
    getApplicationsToRedactWithPaymentOlderThanSevenYears.mockResolvedValue([])
    createApplicationRedact.mockImplementation(app => Promise.resolve(app))

    const result = await getApplicationsToRedact(requestedDate)

    expect(createApplicationRedact).not.toHaveBeenCalled()
    expect(result).toEqual({
      applicationsToRedact: [],
      status: ['applications-to-redact']
    })
  })
})
