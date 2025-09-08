import { getApplicationsToRedact } from '../../../../app/redact-pii/get-applications-to-redact'
import { getFailedApplicationRedact, createApplicationRedact, generateRandomUniqueSbi } from '../../../../app/repositories/application-redact-repository'
import { getApplicationsBySbi, getApplicationsToRedactOlderThan, getOWApplicationsToRedactLastUpdatedBefore } from '../../../../app/repositories/application-repository'
import { getByApplicationReference, getAppRefsWithLatestClaimLastUpdatedBefore } from '../../../../app/repositories/claim-repository'
import { when } from 'jest-when'

jest.mock('../../../../app/repositories/application-redact-repository')
jest.mock('../../../../app/repositories/application-repository')
jest.mock('../../../../app/repositories/claim-repository')
jest.mock('../../../../app/data/index.js', () => ({
  buildData: {
    sequelize: { transaction: jest.fn(async (callback) => callback()) }
  }
}))

describe('get-applications-to-redact', () => {
  const requestedDate = '2025-08-05T00:00:00.000Z'

  beforeEach(() => {
    jest.clearAllMocks()
    when.resetAllWhenMocks()
  })

  it('should create applications to redact and return new applications when there are not previous failed application redact attempts', async () => {
    getFailedApplicationRedact.mockResolvedValue()
    getApplicationsToRedactOlderThan.mockResolvedValueOnce([
      {
        id: '280c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'IAHW-7C72-8871',
        statusId: 3,
        dataValues: { sbi: '123456789' }
      },
      {
        id: '380c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'IAHW-8C72-8871',
        statusId: 3,
        dataValues: { sbi: '223456789' }
      }
    ])
    getAppRefsWithLatestClaimLastUpdatedBefore.mockResolvedValueOnce([
      { applicationReference: 'IAHW-9C72-8871', dataValues: { sbi: '323456789' } }
    ])
    getOWApplicationsToRedactLastUpdatedBefore.mockResolvedValueOnce([
      { reference: 'AHWR-7C72-8871', dataValues: { sbi: '423456789' } }
    ])
    createApplicationRedact.mockImplementation(app => Promise.resolve({ ...app }))
    getByApplicationReference.mockResolvedValue([
      {
        statusId: 'CREATED',
        reference: 'REBC-1'
      }
    ])
    when(getApplicationsBySbi).calledWith('123456789').mockResolvedValueOnce([{ reference: 'IAHW-7C72-8871', createdAt: '2025-04-05T00:00:00.000Z' }, { reference: 'IAHW-1A12-8871', createdAt: '2025-08-05T00:00:00.000Z' }])
    when(getApplicationsBySbi).calledWith('223456789').mockResolvedValueOnce([{ reference: 'IAHW-8C72-8871', createdAt: '2025-06-05T00:00:00.000Z' }])
    when(getApplicationsBySbi).calledWith('323456789').mockResolvedValueOnce([{ reference: 'IAHW-9C72-8871', createdAt: '2025-08-05T00:00:00.000Z' }])
    when(getApplicationsBySbi).calledWith('423456789').mockResolvedValueOnce([{ reference: 'AHWR-7C72-8871', createdAt: '2025-12-05T00:00:00.000Z' }])

    generateRandomUniqueSbi
      .mockResolvedValueOnce('5738383312')
      .mockResolvedValueOnce('6738383312')
      .mockResolvedValueOnce('7738383312')
      .mockResolvedValueOnce('8738383312')

    const result = await getApplicationsToRedact(requestedDate)

    expect(getApplicationsToRedactOlderThan).toHaveBeenCalled()
    expect(createApplicationRedact).toHaveBeenCalledTimes(4)
    expect(result).toEqual({
      applicationsToRedact: [
        { reference: 'IAHW-7C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '123456789', claims: [{ reference: 'REBC-1' }], startDate: '2025-04-05T00:00:00.000Z', endDate: '2025-08-05T00:00:00.000Z' }, redactedSbi: '5738383312' },
        { reference: 'IAHW-8C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '223456789', claims: [{ reference: 'REBC-1' }], startDate: '2025-06-05T00:00:00.000Z' }, redactedSbi: '6738383312' },
        { reference: 'IAHW-9C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '323456789', claims: [{ reference: 'REBC-1' }], startDate: '2025-08-05T00:00:00.000Z' }, redactedSbi: '7738383312' },
        { reference: 'AHWR-7C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '423456789', claims: [{ reference: 'AHWR-7C72-8871' }], startDate: '2025-12-05T00:00:00.000Z' }, redactedSbi: '8738383312' }
      ],
      status: ['applications-to-redact']
    })
  })

  it('should return previously failed application attempts when present', async () => {
    const failedApplications = [
      { reference: 'IAHW-7C72-8871', requestedDate, status: 'applications-to-redact,documents', data: { sbi: '123456789', claims: [{ reference: 'REBC-1' }] } },
      { reference: 'IAHW-8C72-8871', requestedDate, status: 'applications-to-redact,documents', data: { sbi: '223456789', claims: [{ reference: 'REBC-2' }] } }
    ]
    getFailedApplicationRedact.mockResolvedValue(failedApplications)

    const result = await getApplicationsToRedact(requestedDate)

    expect(result).toEqual({
      applicationsToRedact: failedApplications,
      status: ['applications-to-redact', 'documents']
    })
    expect(getApplicationsToRedactOlderThan).not.toHaveBeenCalled()
    expect(createApplicationRedact).not.toHaveBeenCalled()
  })

  it('should return old world application redact data when present', async () => {
    getFailedApplicationRedact.mockResolvedValue()
    getApplicationsToRedactOlderThan.mockResolvedValueOnce([
      {
        id: '280c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'AHWR-7C72-8871',
        statusId: 3,
        dataValues: { sbi: '123456789' },
        createdAt: '2025-08-05T00:00:00.000Z'
      },
      {
        id: '380c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'AHWR-8C72-8871',
        statusId: 3,
        dataValues: { sbi: '223456789' },
        createdAt: '2025-08-05T00:00:00.000Z'
      }
    ])
    getAppRefsWithLatestClaimLastUpdatedBefore.mockResolvedValueOnce([])
    getOWApplicationsToRedactLastUpdatedBefore.mockResolvedValueOnce([
      { reference: 'AHWR-9C72-8871', dataValues: { sbi: '323456789' }, createdAt: '2025-08-05T00:00:00.000Z' }
    ])
    createApplicationRedact.mockImplementation(app => Promise.resolve({ ...app }))
    getByApplicationReference.mockResolvedValue([
      {
        statusId: 'CREATED',
        reference: 'REBC-1'
      }
    ])
    when(getApplicationsBySbi).calledWith('123456789').mockResolvedValueOnce([{ reference: 'AHWR-7C72-8871', createdAt: '2025-04-05T00:00:00.000Z' }, { reference: 'IAHW-1A12-8871', createdAt: '2025-08-05T00:00:00.000Z' }])
    when(getApplicationsBySbi).calledWith('223456789').mockResolvedValueOnce([{ reference: 'AHWR-8C72-8871', createdAt: '2025-04-05T00:00:00.000Z' }, { reference: 'IAHW-1A12-8871', createdAt: '2025-08-05T00:00:00.000Z' }])
    when(getApplicationsBySbi).calledWith('323456789').mockResolvedValueOnce([{ reference: 'AHWR-9C72-8871', createdAt: '2025-04-05T00:00:00.000Z' }, { reference: 'IAHW-1A12-8871', createdAt: '2025-08-05T00:00:00.000Z' }])
    generateRandomUniqueSbi
      .mockResolvedValueOnce('5738383312')
      .mockResolvedValueOnce('6738383312')
      .mockResolvedValueOnce('7738383312')

    const result = await getApplicationsToRedact(requestedDate)

    expect(getApplicationsToRedactOlderThan).toHaveBeenCalled()
    expect(createApplicationRedact).toHaveBeenCalledTimes(3)
    expect(result).toEqual({
      applicationsToRedact: [
        { reference: 'AHWR-7C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '123456789', claims: [{ reference: 'AHWR-7C72-8871' }], startDate: '2025-04-05T00:00:00.000Z', endDate: '2025-08-05T00:00:00.000Z' }, redactedSbi: '5738383312' },
        { reference: 'AHWR-8C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '223456789', claims: [{ reference: 'AHWR-8C72-8871' }], startDate: '2025-04-05T00:00:00.000Z', endDate: '2025-08-05T00:00:00.000Z' }, redactedSbi: '6738383312' },
        { reference: 'AHWR-9C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '323456789', claims: [{ reference: 'AHWR-9C72-8871' }], startDate: '2025-04-05T00:00:00.000Z', endDate: '2025-08-05T00:00:00.000Z' }, redactedSbi: '7738383312' }
      ],
      status: ['applications-to-redact']
    })
  })

  it('should return non-paid old world and new world applications to redact older than 3 years', async () => {
    getFailedApplicationRedact.mockResolvedValue()
    getApplicationsToRedactOlderThan.mockResolvedValueOnce([
      {
        reference: 'AHWR-7C72-8871',
        statusId: 3,
        dataValues: { sbi: '123456789' },
        createdAt: '2025-08-05T00:00:00.000Z'
      },
      {
        reference: 'AHWR-8C72-8872',
        statusId: 9,
        dataValues: { sbi: '223456789' },
        createdAt: '2025-08-05T00:00:00.000Z'
      },
      {
        reference: 'IAHW-9C72-8873',
        statusId: 3,
        dataValues: { sbi: '323456789' },
        createdAt: '2025-08-05T00:00:00.000Z'
      },
      {
        reference: 'IAHW-9C72-8874',
        statusId: 3,
        dataValues: { sbi: '423456789' },
        createdAt: '2025-08-05T00:00:00.000Z'
      }
    ])
    getAppRefsWithLatestClaimLastUpdatedBefore.mockResolvedValueOnce([])
    getOWApplicationsToRedactLastUpdatedBefore.mockResolvedValueOnce([])
    createApplicationRedact.mockImplementation(app => Promise.resolve({ ...app }))
    getByApplicationReference.mockImplementation((reference) => {
      if (reference === 'IAHW-9C72-8873') { return [{ statusId: 8, reference: 'REBC-1' }] }
      if (reference === 'IAHW-9C72-8874') { return [{ statusId: 3, reference: 'REBC-2' }] }
    })
    when(getApplicationsBySbi).calledWith('123456789').mockResolvedValueOnce([{ reference: 'AHWR-7C72-8871', createdAt: '2025-04-05T00:00:00.000Z' }, { reference: 'IAHW-1A12-8871', createdAt: '2025-08-05T00:00:00.000Z' }])
    when(getApplicationsBySbi).calledWith('223456789').mockResolvedValueOnce([{ reference: 'AHWR-8C72-8872', createdAt: '2025-04-05T00:00:00.000Z' }, { reference: 'IAHW-1A12-8871', createdAt: '2025-08-05T00:00:00.000Z' }])
    when(getApplicationsBySbi).calledWith('323456789').mockResolvedValueOnce([{ reference: 'IAHW-9C72-8873', createdAt: '2025-04-05T00:00:00.000Z' }, { reference: 'IAHW-1A12-8871', createdAt: '2025-08-05T00:00:00.000Z' }])
    when(getApplicationsBySbi).calledWith('423456789').mockResolvedValueOnce([{ reference: 'IAHW-9C72-8874', createdAt: '2025-04-05T00:00:00.000Z' }, { reference: 'IAHW-1A12-8871', createdAt: '2025-08-05T00:00:00.000Z' }])
    generateRandomUniqueSbi
      .mockResolvedValueOnce('5738383312')
      .mockResolvedValueOnce('6738383312')
      .mockResolvedValueOnce('7738383312')
      .mockResolvedValueOnce('8738383312')

    const result = await getApplicationsToRedact(requestedDate)

    expect(getApplicationsToRedactOlderThan).toHaveBeenCalled()
    expect(createApplicationRedact).toHaveBeenCalledTimes(2)
    expect(result).toEqual({
      applicationsToRedact: [
        { reference: 'AHWR-7C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '123456789', claims: [{ reference: 'AHWR-7C72-8871' }], startDate: '2025-04-05T00:00:00.000Z', endDate: '2025-08-05T00:00:00.000Z' }, redactedSbi: '5738383312' },
        { reference: 'IAHW-9C72-8874', requestedDate, status: 'applications-to-redact', data: { sbi: '423456789', claims: [{ reference: 'REBC-2' }], startDate: '2025-04-05T00:00:00.000Z', endDate: '2025-08-05T00:00:00.000Z' }, redactedSbi: '6738383312' }
      ],
      status: ['applications-to-redact']
    })
  })

  it('should return 0 applications to redact when 0 previously failed attempts and 0 new applications to redact', async () => {
    getFailedApplicationRedact.mockResolvedValue([])
    getApplicationsToRedactOlderThan.mockResolvedValue([])
    getAppRefsWithLatestClaimLastUpdatedBefore.mockResolvedValueOnce([])
    getOWApplicationsToRedactLastUpdatedBefore.mockResolvedValueOnce([])
    createApplicationRedact.mockImplementation(app => Promise.resolve(app))

    const result = await getApplicationsToRedact(requestedDate)

    expect(createApplicationRedact).not.toHaveBeenCalled()
    expect(result).toEqual({
      applicationsToRedact: [],
      status: []
    })
  })

  it('should return application to redact with its latest claim lastUpdated over seven years', async () => {
    getFailedApplicationRedact.mockResolvedValue()
    getApplicationsToRedactOlderThan.mockResolvedValueOnce([])
    getAppRefsWithLatestClaimLastUpdatedBefore.mockResolvedValueOnce([
      { applicationReference: 'IAHW-9C72-8873', dataValues: { sbi: '323456789' } },
      { applicationReference: 'IAHW-9C72-8874', dataValues: { sbi: '423456789' } }
    ])
    getByApplicationReference.mockImplementation((reference) => {
      if (reference === 'IAHW-9C72-8873') { return [{ statusId: 8, reference: 'REBC-1' }] }
      if (reference === 'IAHW-9C72-8874') { return [{ statusId: 3, reference: 'REBC-2' }] }
    })
    getOWApplicationsToRedactLastUpdatedBefore.mockResolvedValueOnce([
      { reference: 'AHWR-7C72-8871', dataValues: { sbi: '123456789' } },
      { reference: 'AHWR-7C72-8872', dataValues: { sbi: '223456789' } }
    ])
    createApplicationRedact.mockImplementation(app => Promise.resolve({ ...app }))
    when(getApplicationsBySbi).calledWith('123456789').mockResolvedValueOnce([{ reference: 'AHWR-7C72-8871', createdAt: '2025-04-05T00:00:00.000Z' }, { reference: 'IAHW-1A12-8871', createdAt: '2025-08-05T00:00:00.000Z' }])
    when(getApplicationsBySbi).calledWith('223456789').mockResolvedValueOnce([{ reference: 'AHWR-7C72-8872', createdAt: '2025-06-05T00:00:00.000Z' }])
    when(getApplicationsBySbi).calledWith('323456789').mockResolvedValueOnce([{ reference: 'IAHW-9C72-8873', createdAt: '2025-08-05T00:00:00.000Z' }])
    when(getApplicationsBySbi).calledWith('423456789').mockResolvedValueOnce([{ reference: 'IAHW-9C72-8874', createdAt: '2025-12-05T00:00:00.000Z' }])
    generateRandomUniqueSbi
      .mockResolvedValueOnce('5738383312')
      .mockResolvedValueOnce('6738383312')
      .mockResolvedValueOnce('7738383312')
      .mockResolvedValueOnce('8738383312')

    const result = await getApplicationsToRedact(requestedDate)

    expect(getApplicationsToRedactOlderThan).toHaveBeenCalled()
    expect(createApplicationRedact).toHaveBeenCalledTimes(4)
    expect(result).toEqual({
      applicationsToRedact: [
        { reference: 'IAHW-9C72-8873', requestedDate, status: 'applications-to-redact', data: { sbi: '323456789', claims: [{ reference: 'REBC-1' }], startDate: '2025-08-05T00:00:00.000Z' }, redactedSbi: '7738383312' },
        { reference: 'IAHW-9C72-8874', requestedDate, status: 'applications-to-redact', data: { sbi: '423456789', claims: [{ reference: 'REBC-2' }], startDate: '2025-12-05T00:00:00.000Z' }, redactedSbi: '8738383312' },
        { reference: 'AHWR-7C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '123456789', claims: [{ reference: 'AHWR-7C72-8871' }], startDate: '2025-04-05T00:00:00.000Z', endDate: '2025-08-05T00:00:00.000Z' }, redactedSbi: '5738383312' },
        { reference: 'AHWR-7C72-8872', requestedDate, status: 'applications-to-redact', data: { sbi: '223456789', claims: [{ reference: 'AHWR-7C72-8872' }], startDate: '2025-06-05T00:00:00.000Z' }, redactedSbi: '6738383312' }
      ],
      status: ['applications-to-redact']
    })
  })

  it('should return unique agreements', async () => {
    getFailedApplicationRedact.mockResolvedValue()
    getApplicationsToRedactOlderThan.mockResolvedValueOnce([
      {
        id: '280c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'IAHW-7C72-8871',
        statusId: 3,
        dataValues: { sbi: '123456789' }
      },
      {
        id: '380c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'AHWR-7C72-8871',
        statusId: 3,
        dataValues: { sbi: '423456789' }
      }
    ])
    getAppRefsWithLatestClaimLastUpdatedBefore.mockResolvedValueOnce([
      { applicationReference: 'IAHW-7C72-8871', dataValues: { sbi: '123456789' } }
    ])
    getOWApplicationsToRedactLastUpdatedBefore.mockResolvedValueOnce([
      { reference: 'AHWR-7C72-8871', dataValues: { sbi: '423456789' } }
    ])
    createApplicationRedact.mockImplementation(app => Promise.resolve({ ...app }))
    getByApplicationReference.mockResolvedValue([
      {
        statusId: 'CREATED',
        reference: 'REBC-1'
      }
    ])
    when(getApplicationsBySbi).calledWith('123456789').mockResolvedValue([{ reference: 'IAHW-7C72-8871', createdAt: '2025-04-05T00:00:00.000Z' }, { reference: 'IAHW-1A12-8871', createdAt: '2025-08-05T00:00:00.000Z' }])
    when(getApplicationsBySbi).calledWith('423456789').mockResolvedValue([{ reference: 'AHWR-7C72-8871', createdAt: '2025-06-05T00:00:00.000Z' }])
    generateRandomUniqueSbi
      .mockResolvedValueOnce('5738383312')
      .mockResolvedValueOnce('6738383312')
      .mockResolvedValueOnce('7738383312')
      .mockResolvedValueOnce('8738383312')

    const result = await getApplicationsToRedact(requestedDate)

    expect(getApplicationsToRedactOlderThan).toHaveBeenCalled()
    expect(createApplicationRedact).toHaveBeenCalledTimes(2)
    expect(result).toEqual({
      applicationsToRedact: [
        { reference: 'IAHW-7C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '123456789', claims: [{ reference: 'REBC-1' }], startDate: '2025-04-05T00:00:00.000Z', endDate: '2025-08-05T00:00:00.000Z' }, redactedSbi: '5738383312' },
        { reference: 'AHWR-7C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '423456789', claims: [{ reference: 'AHWR-7C72-8871' }], startDate: '2025-06-05T00:00:00.000Z' }, redactedSbi: '6738383312' }
      ],
      status: ['applications-to-redact']
    })
  })
})
