const { DataTypes } = require('sequelize')
const application = require('../../../app/data/models/claim')
const { getReviewType } = require('../../../app/lib/get-review-type')
const generatePreTextForClaim = require('../../../app/lib/generate-pre-text-for-claim')
jest.mock('../../../app/lib/create-agreement-number')
jest.mock('../../../app/lib/create-reference')
jest.mock('../../../app/lib/get-review-type')
jest.mock('../../../app/lib/generate-pre-text-for-claim')

const mockSequelize = {
  define: jest.fn().mockReturnValue({
    create: jest.fn(),
    associate: jest.fn()
  }),
  UUIDV4: 'mock-uuid-v4'
}
const originalDateNow = Date.now
describe('claim model', () => {
  let Claim

  beforeAll(() => {
    Claim = application(mockSequelize, DataTypes)
    global.Date.now = jest.fn(() => new Date('2024-01-01'))
  })

  afterAll(() => {
    global.Date.now = originalDateNow
  })
  test('should define the claim model', () => {
    expect(Claim).toBeDefined()
    expect(mockSequelize.define).toHaveBeenCalledTimes(1)
    expect(Claim.create).toBeDefined()
    expect(Claim.associate).toBeDefined()
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
    const mockCreateAgreementNumber = jest.fn().mockReturnValue('REBC-1234-2345')
    const mockCreateReference = jest.fn().mockReturnValue('AHWR-1234-APP1')
    const mockEndemics = {
      enabled: true
    }
    mockCreateAgreementNumber()
    const mockClaimRecord = {
      id: 'mock-id',
      dataValues: {
        reference: 'REBC-1234-2345'
      },
      update: jest.fn()
    }
    const mockModels = {
      status: {
        sourceKey: 'statusId',
        foreignKey: 'statusId'
      }
    }
    Claim.hooks = {
      afterCreate: jest.fn()
    }

    Claim.associate(mockModels)
    Claim.hooks.afterCreate(mockClaimRecord, mockSequelize)
    expect(mockEndemics.enabled).toBe(true)
    expect(mockCreateAgreementNumber).toHaveBeenCalledTimes(1)
    expect(mockCreateReference).toHaveBeenCalledTimes(0)
    expect(mockClaimRecord.dataValues.reference).toMatch('REBC-1234-2345')
    expect(mockClaimRecord.dataValues.reference).toMatch(mockClaimRecord.dataValues.reference.toUpperCase())
  })
  test('should call createReference to create reference number', async () => {
    const mockCreateAgreementNumber = jest.fn().mockReturnValue('REBC-1234-2345')
    const mockCreateReference = jest.fn().mockReturnValue('AHWR-1234-APP1')
    const mockEndemics = {
      enabled: false
    }

    mockCreateReference()
    const mockClaimRecord = {
      id: 'mock-id',
      dataValues: {
        reference: 'AHWR-1234-APP1'
      },
      update: jest.fn()
    }

    expect(mockEndemics.enabled).toBe(false)
    expect(mockCreateAgreementNumber).toHaveBeenCalledTimes(0)
    expect(mockCreateReference).toHaveBeenCalledTimes(1)
    expect(mockClaimRecord.dataValues.reference).toMatch('AHWR-1234-APP1')
    expect(mockClaimRecord.dataValues.reference).toMatch(mockClaimRecord.dataValues.reference.toUpperCase())
  })
  test('should call createAgreementNumber to create agreement number', async () => {
    jest.mocked(getReviewType).mockReturnValue({ isReview: true, isEndemicsFollowUp: false })
    jest.mocked(generatePreTextForClaim).mockReturnValue('REBC')
    const mockCreateAgreementNumber = jest.fn().mockReturnValue('REBC-1234-2345')
    const mockCreateReference = jest.fn().mockReturnValue('AHWR-1234-APP1')
    const mockEndemics = {
      enabled: true
    }
    mockCreateAgreementNumber()

    const mockClaimRecord = {
      id: 'mock-id',
      dataValues: {
        reference: 'REBC-1234-2345'
      },
      update: jest.fn()
    }

    expect(mockEndemics.enabled).toBe(true)
    expect(mockCreateAgreementNumber).toHaveBeenCalledTimes(1)
    expect(mockCreateReference).toHaveBeenCalledTimes(0)
    expect(mockClaimRecord.dataValues.reference).toMatch('REBC-1234-2345')
    expect(mockClaimRecord.dataValues.reference).toMatch(mockClaimRecord.dataValues.reference.toUpperCase())
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

    await Claim.hooks.afterCreate(claimRecord, mockSequelize)
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
  test('should call afterCreate hook', async () => {
    const mockEndemics = {
      enabled: true
    }

    const mockClaimRecord = {
      id: 'mock-id',
      dataValues: {
        reference: 'REBC-1234-2345'
      },
      update: jest.fn()
    }
    const mockModels = {
      status: {
        sourceKey: 'statusId',
        foreignKey: 'statusId'
      }
    }
    Claim.hooks = {
      afterCreate: jest.fn()
    }

    Claim.associate(mockModels)
    expect(mockEndemics.enabled).toBe(true)

    expect(mockClaimRecord.dataValues.reference).toMatch('REBC-1234-2345')
    expect(mockClaimRecord.dataValues.reference).toMatch(mockClaimRecord.dataValues.reference.toUpperCase())
  })
})
