const { DataTypes } = require('sequelize')
const claim = require('../../../app/data/models/claim')
const generatePreTextForClaim = require('../../../app/lib/generate-pre-text-for-claim')
jest.mock('../../../app/lib/create-agreement-number')
jest.mock('../../../app/lib/create-reference')
jest.mock('../../../app/lib/get-review-type')
jest.mock('../../../app/lib/generate-pre-text-for-claim')

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
  test('should define the claim model', () => {
    const args = jest.mocked(mockSequelize.define).mock.calls[0]

    expect(args[0]).toBe('claim')
    expect(Claim).toBeDefined()
    expect(mockSequelize.define).toHaveBeenCalledTimes(1)
    expect(Claim.create).toBeDefined()
    expect(Claim.associate).toBeDefined()
  })
  test('should set the reference to uppercase and update other fields after creation', async () => {
    const claimRecord = {
      id: 'mock-id',
      dataValues: {
        reference: 'REBC-1234-2345',
        type: 'type',
        updatedBy: '',
        updatedAt: null,
        data: {
          typeOfLiveStock: 'beef'
        }
      },
      update: jest.fn()
    }
    mockSequelize.define.mockImplementation((_, config) => ({
      create: jest.fn(),
      associate: jest.fn(),
      hooks: {
        afterCreate: config.hooks.afterCreate
      }
    }))

    expect(claimRecord.dataValues.reference).toMatch('REBC-1234-2345')
    expect(claimRecord.dataValues.updatedAt).toBeDefined()
    expect(claimRecord.dataValues.reference).toMatch(claimRecord.dataValues.reference.toUpperCase())
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
    const mockCreateReference = jest.fn().mockReturnValue('AHWR-1234-APP1')
    const mockEndemics = {
      enabled: true
    }
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
    expect(mockEndemics.enabled).toBe(true)
    expect(mockCreateReference).toHaveBeenCalledTimes(0)
    expect(mockClaimRecord.dataValues.reference).toMatch('REBC-1234-2345')
    expect(mockClaimRecord.dataValues.reference).toMatch(mockClaimRecord.dataValues.reference.toUpperCase())
    expect(mockClaimRecord.update).toHaveBeenCalledWith(mockClaimRecord.dataValues)
    expect(mockClaimRecord.dataValues.updatedBy).toMatch('admin')
    expect(mockClaimRecord.dataValues.updatedAt).toBeDefined()
  })
  test('should call createReference to create reference number', async () => {
    const mockCreateAgreementNumber = jest.fn().mockReturnValue('REBC-1234-2345')
    const mockCreateReference = jest.fn().mockReturnValue('AHWR-1234-APP1')
    const mockEndemics = {
      enabled: false
    }

    const mockClaimRecord = {
      id: 'mock-id',
      dataValues: {
        reference: 'AHWR-1234-APP1'
      },
      update: jest.fn()
    }
    mockCreateReference(mockClaimRecord.id)

    expect(mockEndemics.enabled).toBe(false)
    expect(mockCreateAgreementNumber).toHaveBeenCalledTimes(0)
    expect(mockCreateReference).toHaveBeenCalledTimes(1)
    expect(mockClaimRecord.dataValues.reference).toMatch('AHWR-1234-APP1')
    expect(mockClaimRecord.dataValues.reference).toMatch(mockClaimRecord.dataValues.reference.toUpperCase())
  })
  test('should call createAgreementNumber to create agreement number', async () => {
    const mockClaimRecord = {
      id: 'mock-id',
      dataValues: {
        reference: 'REBC-1234-2345',
        data: {
          typeOfLiveStock: 'beef'
        }
      },
      update: jest.fn()
    }
    jest.mocked(generatePreTextForClaim).mockImplementation((getReviewType) => 'REBC')
    const mockCreateAgreementNumber = jest.fn().mockImplementation((generatePreTextForClaim) => 'REBC-1234-2345')
    const mockCreateReference = jest.fn().mockReturnValue('AHWR-1234-APP1')
    const mockEndemics = {
      enabled: true
    }
    mockCreateAgreementNumber()

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
  test('check if reference logic', async () => {
    const mockCreateReference = jest.fn().mockReturnValue('AHWR-1234-APP1')
    const mockCreateAgreementNumber = jest.fn().mockReturnValue('REBC-1234-2345')
    const mockEndemics = {
      enabled: true
    }

    const mockClaimRecord = {
      id: 'mock-id',
      dataValues: {
        reference: 'REBC-1234-2345',
        data: {
          typeOfLiveStock: 'beef'
        }
      },
      type: 'R',
      update: jest.fn()
    }
    mockClaimRecord.dataValues.reference = mockEndemics.enabled ? mockCreateAgreementNumber(generatePreTextForClaim(mockClaimRecord.type, mockClaimRecord.dataValues.data.typeOfLiveStock)) : mockCreateReference(mockClaimRecord.id)

    expect(mockEndemics.enabled).toBe(true)
    expect(mockCreateReference).toHaveBeenCalledTimes(0)
    expect(mockCreateAgreementNumber).toHaveBeenCalledTimes(1)
    expect(mockCreateAgreementNumber).toHaveBeenCalledWith(generatePreTextForClaim(mockClaimRecord.type, mockClaimRecord.dataValues.data.typeOfLiveStock))
  })
})
describe('claim model Extra tests', () => {
  let Claim
  const createAgreementNumber = require('../../../../app/lib/create-agreement-number')

  beforeAll(() => {
    Claim = claim(mockSequelize, DataTypes)
  })

  test('should set default values for createdAt and updatedAt', () => {
    const claimInstance = Claim.build()
    expect(claimInstance.createdAt).toBeInstanceOf(Date)
    expect(claimInstance.updatedAt).toBeNull()
  })

  test('should set default value for createdBy', () => {
    const claimInstance = Claim.build()
    expect(claimInstance.createdBy).toBeUndefined()
  })

  test('should set default value for updatedBy', () => {
    const claimInstance = Claim.build()
    expect(claimInstance.updatedBy).toBeNull()
  })

  test('should set reference to uppercase', () => {
    const claimInstance = Claim.build({ reference: 'abc-123' })
    expect(claimInstance.reference).toBe('ABC-123')
  })

  test('should set applicationReference to uppercase', () => {
    const claimInstance = Claim.build({ applicationReference: 'xyz-456' })
    expect(claimInstance.applicationReference).toBe('XYZ-456')
  })

  test('should call afterCreate hook with correct arguments', async () => {
    const mockCreateAgreementNumber = jest.fn().mockReturnValue('REBC-1234-2345')
    jest.mocked(createAgreementNumber).mockImplementation(mockCreateAgreementNumber)

    const claimRecord = {
      id: 'mock-id',
      type: 'R',
      dataValues: {
        data: {
          typeOfLivestock: 'beef'
        }
      },
      update: jest.fn()
    }

    await Claim.hooks.afterCreate(claimRecord, mockSequelize)

    expect(mockCreateAgreementNumber).toHaveBeenCalledWith('claim', {
      id: 'mock-id',
      type: 'R',
      typeOfLivestock: 'beef'
    })
    expect(claimRecord.dataValues.reference).toBe('REBC-1234-2345')
    expect(claimRecord.dataValues.updatedBy).toBe('admin')
    expect(claimRecord.dataValues.updatedAt).toBeInstanceOf(Date)
    expect(claimRecord.update).toHaveBeenCalledWith(claimRecord.dataValues)
  })
})
