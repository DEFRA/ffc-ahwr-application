import { DataTypes } from 'sequelize'
import { application } from '../../../app/data/models/application'

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
