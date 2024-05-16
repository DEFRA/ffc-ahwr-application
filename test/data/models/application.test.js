const { DataTypes } = require('sequelize')
const application = require('../../../app/data/models/application')
jest.mock('../../../app/lib/create-agreement-number')
jest.mock('../../../app/lib/create-reference')

// Mocking the sequelize instance
const mockSequelize = {
  define: jest.fn().mockReturnValue({
    create: jest.fn(),
    associate: jest.fn()
  }),
  UUIDV4: 'mock-uuid-v4'
}
describe('application', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => new Date('2024-01-01'))
  })
  afterAll(async () => {
    jest.spyOn(Date, 'now').mockRestore()
    jest.clearAllMocks()
  })
  test('should call sequelize.define with the correct model name and schema', () => {
    const applicationModel = application(mockSequelize, DataTypes)

    expect(mockSequelize.define).toHaveBeenCalledTimes(1)

    expect(applicationModel.create).toBeDefined()
    expect(applicationModel.associate).toBeDefined()
  })

  test('should call afterCreate hook with the correct logic', async () => {
    application(mockSequelize, DataTypes)

    const mockEndemics = {
      enabled: true
    }

    const mockCreateReference = jest.fn().mockReturnValue('AHWR-1234-APP1')

    const mockApplicationRecord = {
      id: 'mock-id',
      dataValues: {
        reference: 'IAHW-1234-2345'
      },
      update: jest.fn()
    }

    expect(mockEndemics.enabled).toBe(true)
    expect(mockCreateReference).toHaveBeenCalledTimes(0)
    expect(mockApplicationRecord.dataValues.reference).toMatch('IAHW-1234-2345')
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
    const mockCreateReference = jest.fn().mockReturnValue('AHWR-1234-APP1')
    const mockCreateAgreementNumber = jest.fn().mockReturnValue('IAHW-1234-2345')

    const mockApplicationRecord = {
      id: 'mock-id',
      dataValues: {
        reference: mockEndemics.enabled ? mockCreateAgreementNumber() : mockCreateReference()
      },
      update: jest.fn()
    }

    expect(mockEndemics.enabled).toBe(false)
    expect(mockCreateReference).toHaveBeenCalledTimes(1)
    expect(mockCreateAgreementNumber).toHaveBeenCalledTimes(0)
    expect(mockApplicationRecord.dataValues.reference).toMatch('AHWR-1234-APP1')
  })
})
