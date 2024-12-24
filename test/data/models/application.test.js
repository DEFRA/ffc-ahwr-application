const { DataTypes } = require('sequelize')
const { application, updateApplicationRecord } = require('../../../app/data/models/application').default

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
})

describe('updateApplicationRecord', () => {
  test('it updates the record as required, and sets the updated at to now', async () => {
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2020-01-01'))

    const mockUpdateFunction = jest.fn()
    const applicationRecord = {
      dataValues: {
        reference: 'TEMP-E31F-HG76',
        updatedBy: '',
        updatedAt: new Date(2000, 0, 1)
      },
      update: mockUpdateFunction
    }

    await updateApplicationRecord(applicationRecord)

    expect(mockUpdateFunction).toHaveBeenCalledWith({
      reference: 'IAHW-E31F-HG76',
      updatedBy: 'admin',
      updatedAt: new Date('2020-01-01')
    })

    jest.useRealTimers()
  })
})
