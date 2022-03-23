const createReference = require('../../../../app/lib/create-reference')

describe('Test create reference number', () => {
  test('Returns reference number', async () => {
    const reference = createReference()
    expect(reference.length).toBe(14)
  })
})
