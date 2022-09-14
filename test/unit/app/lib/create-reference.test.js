const createReference = require('../../../../app/lib/create-reference')
const { v4: uuid } = require('uuid')
describe('Test create reference number', () => {
  test('Returns reference number', async () => {
    const reference = createReference(uuid())
    expect(reference.length).toBe(14)
  })
})
