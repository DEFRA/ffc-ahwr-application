const { Sequelize, DataTypes } = require('sequelize')
const createAgreementNumber = require('../../../../app/lib/create-agreement-number')

jest.mock('../../../../app/lib/create-agreement-number')

describe('application model', () => {
  let Application
  let mockSequelize

  beforeEach(() => {
    mockSequelize = new Sequelize('sqlite::memory:')
    Application = require('../../../../app/data/models/application')(
      mockSequelize,
      DataTypes
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should set reference to uppercase', async () => {
    const application = await Application.create({ reference: 'abc123' })
    expect(application.reference).toBe('ABC123')
  })

  it('should generate agreement number after create', async () => {
    const mockId = 'mock-id'
    createAgreementNumber.mockReturnValue('AGREEMENT-123')
    const application = await Application.create({ id: mockId })
    expect(createAgreementNumber).toHaveBeenCalledWith('apply', { id: mockId })
    expect(application.reference).toBe('AGREEMENT-123')
  })

  it('should set default values on create', async () => {
    const application = await Application.create({})
    expect(application.claimed).toBe(false)
    expect(application.createdBy).toBe('admin')
    expect(application.updatedBy).toBe('admin')
    expect(application.updatedAt).toBeInstanceOf(Date)
  })
})
