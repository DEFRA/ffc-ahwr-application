const { DataTypes } = require('sequelize')
const { claim } = require('../../../app/data/models/claim')
jest.mock('../../../app/lib/create-reference')

const mockSequelize = {
  define: jest.fn().mockReturnValue({
    create: jest.fn(),
    hooks: {
      afterCreate: jest.fn()
    }
  }),
  associate: jest.fn(),
  UUIDV4: 'mock-uuid-v4'
}
describe('claim model', () => {
  let Claim

  beforeAll(() => {
    Claim = claim(mockSequelize, DataTypes)
    Date.now = jest.fn(() => 1482363367071)
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  test('should associate the claim model with application and status models', () => {
    const mockModels = {
      application: jest.fn(),
      status: jest.fn()
    }
    Claim.hasOne = jest.fn()
    Claim.associate(mockModels)
    expect(Claim.hasOne).toHaveBeenCalledWith(mockModels.application, {
      sourceKey: 'applicationReference',
      foreignKey: 'reference'
    })
    expect(Claim.hasOne).toHaveBeenCalledWith(mockModels.status, {
      sourceKey: 'statusId',
      foreignKey: 'statusId'
    })
  })
  test('should call afterCreate hook with the correct logic', async () => {
    const mockClaimRecord = {
      id: 'mock-id',
      dataValues: {
        reference: 'REBC-1234-2345',
        update: jest.fn()
      },
      data: {
        typeOfLiveStock: 'beef'
      },
      type: 'R'
    }
    const mockModels = {
      status: {
        sourceKey: 'statusId',
        foreignKey: 'statusId'
      }
    }
    const _ = {}
    mockClaimRecord.update = jest.fn().mockImplementation((data) => {
      mockClaimRecord.dataValues = data
    })
    Claim.hooks.afterCreate.mockImplementation(async (mockClaimRecord, _) => {
      mockClaimRecord.dataValues.reference = 'REBC-1234-2345'
      mockClaimRecord.dataValues.updatedBy = 'admin'
      mockClaimRecord.dataValues.updatedAt = new Date()
      await mockClaimRecord.update(mockClaimRecord.dataValues)
    })

    await Claim.hooks.afterCreate(mockClaimRecord, _)

    Claim.associate(mockModels)
    Claim.hooks.afterCreate(mockClaimRecord, mockSequelize)
    expect(mockClaimRecord.dataValues.reference).toMatch('REBC-1234-2345')
    expect(mockClaimRecord.dataValues.reference).toMatch(mockClaimRecord.dataValues.reference.toUpperCase())
    expect(mockClaimRecord.update).toHaveBeenCalledWith(mockClaimRecord.dataValues)
    expect(mockClaimRecord.dataValues.updatedBy).toMatch('admin')
    expect(mockClaimRecord.dataValues.updatedAt).toBeDefined()
  })

  test('set reference to uppercase and update other fields in the afterCreate hook', async () => {
    const claimRecord = {
      id: 'mock-id',
      dataValues: {
        reference: 'REBC-1234-2345',
        type: 'type'
      },
      update: jest.fn()
    }
    const _ = {}

    await Claim.hooks.afterCreate(claimRecord, _)
    expect(claimRecord.dataValues.reference).toMatch('REBC-1234-2345')
    expect(claimRecord.dataValues.reference).toMatch(claimRecord.dataValues.reference.toUpperCase())
  })
  test('test relationship', async () => {
    const mockModels = {
      application: jest.fn(),
      status: jest.fn()
    }
    Claim.hasOne = jest.fn()
    Claim.associate(mockModels)
    expect(Claim.hasOne).toHaveBeenCalledWith(mockModels.application, {
      sourceKey: 'applicationReference',
      foreignKey: 'reference'
    })
    expect(Claim.hasOne).toHaveBeenCalledWith(mockModels.status, {
      sourceKey: 'statusId',
      foreignKey: 'statusId'
    })
  })
})
