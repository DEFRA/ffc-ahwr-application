const createReference = require('../../../../app/lib/create-reference')

describe('create-reference', () => {
  test('should return a string temp reference for an application', () => {
    const tempRef = createReference('application')

    // A-Z excluding O, and 1-9
    const regex = /^IAHW-[A-NP-Z1-9]{4}-[A-NP-Z1-9]{4}$/
    expect(tempRef).toMatch(regex)
  })

  test('should return a string temp reference for an beef review claim', () => {
    const tempRef = createReference('review', 'beef')

    // A-Z excluding O, and 1-9
    const regex = /^REBC-[A-NP-Z1-9]{4}-[A-NP-Z1-9]{4}$/
    expect(tempRef).toMatch(regex)
  })

  test('should return a string temp reference for an sheep endemics claim', () => {
    const tempRef = createReference('endemics', 'sheep')

    // A-Z excluding O, and 1-9
    const regex = /^FUSH-[A-NP-Z1-9]{4}-[A-NP-Z1-9]{4}$/
    expect(tempRef).toMatch(regex)
  })

  test('should not generate the same ID twice in 20,000 IDs', () => {
    const ids = []
    const numberToCreate = 20000

    for (let index = 0; index < numberToCreate; index++) {
      ids.push(createReference('review', 'pigs'))
    }

    expect(ids.length).toEqual(numberToCreate)

    const set = new Set(ids)

    expect(set.size).toEqual(numberToCreate)
  })
})
