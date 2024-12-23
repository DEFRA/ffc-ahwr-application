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
    expect(() => createClaimReference('TEMP-CLAIM-A2SQ-PFNF', 'Q', 'beef')).toThrow()
  })

  test('should throw an error if an incorrect livestock type is passed', () => {
    expect(() => createClaimReference('TEMP-CLAIM-A2SQ-PFNF', 'R', 'beef cattle')).toThrow()
  })

  test('should return a temp reference for an beef review claim', () => {
    const result = createClaimReference('TEMP-CLAIM-A2SQ-PFNF', 'R', 'beef')

    expect(result).toEqual('REBC-A2SQ-PFNF')
  })

  test('should return a temp reference for an sheep endemics claim', () => {
    const result = createClaimReference('TEMP-CLAIM-A2SQ-PFNF', 'E', 'sheep')

    expect(result).toEqual('FUSH-A2SQ-PFNF')
  })

  test('should return a temp reference for an dairy endemics claim', () => {
    const result = createClaimReference('TEMP-CLAIM-A2SQ-PFNF', 'E', 'dairy')

    expect(result).toEqual('FUDC-A2SQ-PFNF')
  })
})
