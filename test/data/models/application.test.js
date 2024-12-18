const { DataTypes } = require('sequelize')
const { application } = require('../../../app/data/models/application')
jest.mock('../../../app/lib/create-agreement-number')
jest.mock('../../../app/lib/create-reference')

// Mocking the sequelize instance
const mockSequelize = {
  define: jest.fn().mockReturnValue({
    create: jest.fn(),
    associate: jest.fn(),
    hooks: {
      afterCreate: jest.fn()
    }
  }),
  UUIDV4: 'mock-uuid-v4'
}
describe('application', () => {
  beforeAll(() => {
    Date.now = jest.fn(() => 1482363367071)
  })
  afterAll(async () => {
    jest.clearAllMocks()
  })
  test('should call sequelize.define with the correct model name and schema', () => {
    const applicationModel = application(mockSequelize, DataTypes)

    const args = jest.mocked(mockSequelize.define).mock.calls[0]

    expect(args[0]).toBe('application')
    expect(mockSequelize.define).toHaveBeenCalledTimes(1)
    expect(args[1]).toMatchObject({
      id: {
        type: DataTypes.UUID,
        primaryKey: true
      },
      reference: {
        type: DataTypes.STRING
      },
      updatedBy: {
        type: DataTypes.STRING
      },
      updatedAt: {
        type: DataTypes.DATE
      }
    })

    expect(applicationModel.create).toBeDefined()
    expect(applicationModel.associate).toBeDefined()
  })

  test('should call afterCreate hook with the correct logic', async () => {
    const applicationModel = application(mockSequelize, DataTypes)

    const mockEndemics = {
      enabled: true
    }
    const mockApplicationRecord = {
      id: 'mock-id',
      dataValues: {
        reference: 'IAHW-1234-2345'
      },
      update: jest.fn().mockImplementation((data) => {
        mockApplicationRecord.dataValues = data
      })
    }
    const _ = undefined

    await mockApplicationRecord.update(mockApplicationRecord.dataValues)

    const mockCreateAgreementNumber = jest.fn().mockReturnValue('IAHW-1234-2345')
    const mockCreateReference = jest.fn().mockReturnValue('AHWR-1234-APP1')
    applicationModel.hooks.afterCreate.mockImplementation(async (mockApplicationRecord, _) => {
      mockApplicationRecord.dataValues.reference = mockEndemics.enabled ? mockCreateAgreementNumber() : mockCreateReference(mockApplicationRecord.id)
      mockApplicationRecord.dataValues.updatedBy = 'admin'
      mockApplicationRecord.dataValues.updatedAt = new Date()
      await mockApplicationRecord.update(mockApplicationRecord.dataValues)
    })

    await applicationModel.hooks.afterCreate(mockApplicationRecord, _)
    mockCreateReference(mockApplicationRecord.id)
    mockCreateAgreementNumber()

    expect(mockEndemics.enabled).toBe(true)

    expect(mockCreateAgreementNumber).toHaveBeenCalled()
    expect(mockApplicationRecord.dataValues.reference).toMatch('IAHW-1234-2345')
    expect(mockApplicationRecord.dataValues.reference).toMatch(mockApplicationRecord.dataValues.reference.toUpperCase())
    expect(mockCreateReference).toHaveBeenCalledWith(mockApplicationRecord.id)
    expect(mockApplicationRecord.update).toHaveBeenCalledWith(mockApplicationRecord.dataValues)
    expect(mockApplicationRecord.dataValues.updatedBy).toMatch('admin')
  })
  test('should call createAgreementNumber when endemics is true  ', async () => {
    application(mockSequelize, DataTypes)

    const mockEndemics = {
      enabled: true
    }
    const mockCreateReference = jest.fn().mockReturnValue('AHWR-1234-APP1')
    const mockCreateAgreementNumber = jest.fn().mockReturnValue('IAHW-1234-2345')

    mockCreateAgreementNumber()
    const mockApplicationRecord = {
      id: 'mock-id',
      dataValues: {
        reference: 'IAHW-1234-2345'
      },
      update: jest.fn()
    }

    expect(mockEndemics.enabled).toBe(true)
    expect(mockCreateReference).toHaveBeenCalledTimes(0)
    expect(mockCreateAgreementNumber).toHaveBeenCalledTimes(1)
    expect(mockApplicationRecord.dataValues.reference).toMatch('IAHW-1234-2345')
  })
  test('should call createReference when endemics is false  ', async () => {
    application(mockSequelize, DataTypes)

    const mockEndemics = {
      enabled: false
    }

    const mockCreateAgreementNumber = jest.fn().mockReturnValue('IAHW-1234-2345')
    const mockCreateReference = jest.fn().mockImplementation((id) => ('AHWR-1234-APP1'))
    const mockApplicationRecord = {
      id: 'mock-id',
      dataValues: {
        reference: mockEndemics.enabled ? mockCreateAgreementNumber() : mockCreateReference()
      },
      update: jest.fn()
    }
    mockCreateReference(mockApplicationRecord.id)

    expect(mockEndemics.enabled).toBe(false)
    expect(mockCreateReference).toHaveBeenCalled()
    expect(mockCreateAgreementNumber).toHaveBeenCalledTimes(0)
    expect(mockApplicationRecord.dataValues.reference).toMatch('AHWR-1234-APP1')
    expect(mockApplicationRecord.dataValues.reference).toMatch(mockApplicationRecord.dataValues.reference.toUpperCase())
    expect(mockCreateReference).toHaveBeenCalledWith(mockApplicationRecord.id)
  })
})
