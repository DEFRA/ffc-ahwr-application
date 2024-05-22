describe('ContactHistory model', () => {
  let ContactHistory

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
  const { DataTypes } = require('sequelize')
  beforeEach(() => {
    ContactHistory = require('../../../../app/data/models/contact-history')(
      mockSequelize,
      DataTypes
    )
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should set default values on create', async () => {
    const contactHistory = await ContactHistory.create({})
    expect(contactHistory.createdBy).toBe('admin')
    expect(contactHistory.updatedBy).toBe('admin')
    expect(contactHistory.updatedAt).toBeInstanceOf(Date)
  })

  it('should not allow null values for required fields', async () => {
    await expect(ContactHistory.create({})).rejects.toThrow()
  })

  it('should trim whitespace from note field', async () => {
    const contactHistory = await ContactHistory.create({
      note: '  Test note  '
    })
    expect(contactHistory.note).toBe('Test note')
  })

  it('should set updatedAt on update', async () => {
    const contactHistory = await ContactHistory.create({ note: 'Test note' })
    const originalUpdatedAt = contactHistory.updatedAt
    await contactHistory.update({ note: 'Updated note' })
    expect(contactHistory.updatedAt).not.toEqual(originalUpdatedAt)
  })
})
