const { DataTypes } = require('sequelize')
const { claim } = require('../../../app/data/models/claim')

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
