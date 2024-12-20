const { createApplicationReference, createClaimReference } = require('../../../../app/lib/create-reference')

describe('createApplicationReference', () => {
  test('should take an existing TEMP reference and swap the prefix for IAHW', () => {
    expect(createApplicationReference('TEMP-A2SQ-PFNF')).toEqual('IAHW-A2SQ-PFNF')
  })

  test('should only replace the first instance of TEMP, incase the ID randomly has TEMP inside it', () => {
    expect(createApplicationReference('TEMP-TEMP-TEMP')).toEqual('IAHW-TEMP-TEMP')
  })
})

describe('createClaimReference', () => {
  test('should throw an error if an incorrect claim type is passed', () => {
    expect(() => createClaimReference('claim', 'beef')).toThrow()
  })

  test('should throw an error if an incorrect livestock type is passed', () => {
    expect(() => createClaimReference('review', 'beef cattle')).toThrow()
  })

  test('should return a string temp reference for an beef review claim', () => {
    const tempRef = createClaimReference('review', 'beef')

    // A-Z excluding O, and 1-9
    const regex = /^REBC-[A-NP-Z1-9]{4}-[A-NP-Z1-9]{4}$/
    expect(tempRef).toMatch(regex)
  })

  test('should return a string temp reference for an sheep endemics claim', () => {
    const tempRef = createClaimReference('endemics', 'sheep')

    // A-Z excluding O, and 1-9
    const regex = /^FUSH-[A-NP-Z1-9]{4}-[A-NP-Z1-9]{4}$/
    expect(tempRef).toMatch(regex)
  })

  test('should not generate the same ID twice in 20,000 IDs', () => {
    const ids = []
    const numberToCreate = 20000

    for (let index = 0; index < numberToCreate; index++) {
      ids.push(createClaimReference('review', 'pigs'))
    }

    expect(ids.length).toEqual(numberToCreate)

    const set = new Set(ids)

    expect(set.size).toEqual(numberToCreate)
  })
})
