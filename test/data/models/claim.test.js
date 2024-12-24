const { DataTypes } = require('sequelize')
const { claim, updateClaimRecord } = require('../../../app/data/models/claim').default

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
  afterAll(() => {
    jest.clearAllMocks()
  })

  test('should call sequelize.define with the correct model name and schema', () => {
    const claimModel = claim(mockSequelize, DataTypes)

    const args = jest.mocked(mockSequelize.define).mock.calls[0]

    expect(args[0]).toBe('claim')
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
      updatedAt: DataTypes.DATE
    })

    expect(claimModel.create).toBeDefined()
    expect(claimModel.associate).toBeDefined()
  })
})

describe('updateClaimRecord', () => {
  test('it updates the record as required, and sets the updated at to now', async () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2020-01-01'))

    const mockUpdateFunction = jest.fn()
    const claimRecord = {
      dataValues: {
        data: { typeOfLivestock: 'dairy' },
        reference: 'TEMP-CLAIM-E31F-HG76',
        updatedBy: '',
        updatedAt: new Date(2000, 0, 1)
      },
      type: 'R',
      update: mockUpdateFunction
    }

    await updateClaimRecord(claimRecord)

    expect(mockUpdateFunction).toHaveBeenCalledWith({
      ...claimRecord.dataValues,
      reference: 'REDC-E31F-HG76',
      updatedBy: 'admin',
      updatedAt: new Date('2020-01-01')
    })

    jest.useRealTimers()
  })
})
