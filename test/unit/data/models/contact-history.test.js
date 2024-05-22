describe('ContactHistory model', () => {
  let ContactHistory
  let mockSequelize
  const { Sequelize, DataTypes } = require('sequelize')
  beforeEach(() => {
    mockSequelize = new Sequelize('sqlite::memory:')
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
