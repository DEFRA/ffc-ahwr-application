import { getApplicationsToRedact } from '../../../../app/redact-pii/get-applications-to-redact'
import { getFailedApplicationRedact, createApplicationRedact } from '../../../../app/repositories/application-redact-repository'
import { getApplicationsToRedactOlderThan } from '../../../../app/repositories/application-repository'
import { getByApplicationReference } from '../../../../app/repositories/claim-repository'

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
  })

  it('should create applications to redact and return new applications when there are not previous failed application redact attempts', async () => {
    getFailedApplicationRedact.mockResolvedValue()
    getApplicationsToRedactOlderThan.mockResolvedValue([
      {
        id: '280c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'IAHW-7C72-8871',
        statusId: 3,
        sbi: '123456789'
      },
      {
        id: '380c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'IAHW-8C72-8871',
        statusId: 3,
        sbi: '223456789'
      },
      {
        id: '180c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'IAHW-9C72-8871',
        statusId: 3,
        sbi: '323456789'
      }
    ])
    createApplicationRedact.mockImplementation(app => Promise.resolve({ ...app }))
    getByApplicationReference.mockResolvedValue([
      {
        statusId: 'CREATED',
        reference: 'REBC-1'
      }
    ])

    const result = await getApplicationsToRedact(requestedDate)

    expect(getApplicationsToRedactOlderThan).toHaveBeenCalled()
    expect(createApplicationRedact).toHaveBeenCalledTimes(3)
    expect(result).toEqual({
      applicationsToRedact: [
        { reference: 'IAHW-7C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '123456789', claims: [{ reference: 'REBC-1' }] } },
        { reference: 'IAHW-8C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '223456789', claims: [{ reference: 'REBC-1' }] } },
        { reference: 'IAHW-9C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '323456789', claims: [{ reference: 'REBC-1' }] } }
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

  it('should return new old world application redact data when present', async () => {
    getFailedApplicationRedact.mockResolvedValue()
    getApplicationsToRedactOlderThan.mockResolvedValue([
      {
        id: '280c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'AHWR-7C72-8871',
        statusId: 3,
        sbi: '123456789'
      },
      {
        id: '380c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'AHWR-8C72-8871',
        statusId: 3,
        sbi: '223456789'
      },
      {
        id: '180c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'AHWR-9C72-8871',
        statusId: 3,
        sbi: '323456789'
      }
    ])
    createApplicationRedact.mockImplementation(app => Promise.resolve({ ...app }))
    getByApplicationReference.mockResolvedValue([
      {
        statusId: 'CREATED',
        reference: 'REBC-1'
      }
    ])

    const result = await getApplicationsToRedact(requestedDate)

    expect(getApplicationsToRedactOlderThan).toHaveBeenCalled()
    expect(createApplicationRedact).toHaveBeenCalledTimes(3)
    expect(result).toEqual({
      applicationsToRedact: [
        { reference: 'AHWR-7C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '123456789', claims: [{ reference: 'AHWR-7C72-8871' }] } },
        { reference: 'AHWR-8C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '223456789', claims: [{ reference: 'AHWR-8C72-8871' }] } },
        { reference: 'AHWR-9C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '323456789', claims: [{ reference: 'AHWR-9C72-8871' }] } }
      ],
      status: ['applications-to-redact']
    })
  })

  it.only('should skip paid old world and new world applications', async () => {
    getFailedApplicationRedact.mockResolvedValue()
    getApplicationsToRedactOlderThan.mockResolvedValue([
      {
        id: '280c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'AHWR-7C72-8871',
        statusId: 3,
        sbi: '123456789'
      },
      {
        id: '380c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'AHWR-8C72-8872',
        statusId: 9,
        sbi: '223456789'
      },
      {
        id: '180c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'IAHW-9C72-8873',
        sbi: '323456789'
      },
      {
        id: '580c5d84-cc3f-4e50-9519-8b5a1fc83ac0',
        reference: 'IAHW-9C72-8874',
        sbi: '423456789'
      }
    ])
    createApplicationRedact.mockImplementation(app => Promise.resolve({ ...app }))
    getByApplicationReference.mockImplementation((reference) => {
      if (reference === 'IAHW-9C72-8873') { return [{ statusId: 8, reference: 'REBC-1' }] }
      if (reference === 'IAHW-9C72-8874') { return [{ statusId: 3, reference: 'REBC-2' }] }
    })

    const result = await getApplicationsToRedact(requestedDate)

    expect(getApplicationsToRedactOlderThan).toHaveBeenCalled()
    expect(createApplicationRedact).toHaveBeenCalledTimes(2)
    expect(result).toEqual({
      applicationsToRedact: [
        { reference: 'AHWR-7C72-8871', requestedDate, status: 'applications-to-redact', data: { sbi: '123456789', claims: [{ reference: 'AHWR-7C72-8871' }] } },
        { reference: 'IAHW-9C72-8874', requestedDate, status: 'applications-to-redact', data: { sbi: '423456789', claims: [{ reference: 'REBC-2' }] } }
      ],
      status: ['applications-to-redact']
    })
  })

  it('should return 0 applications to redact when 0 previously failed attempts and 0 new applications to redact', async () => {
    getFailedApplicationRedact.mockResolvedValue([])
    getApplicationsToRedactOlderThan.mockResolvedValue([])
    createApplicationRedact.mockImplementation(app => Promise.resolve(app))

    const result = await getApplicationsToRedact(requestedDate)

    expect(createApplicationRedact).not.toHaveBeenCalled()
    expect(result).toEqual({
      applicationsToRedact: [],
      status: []
    })
  })
})
