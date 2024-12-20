const { randomInt } = require('node:crypto')

/**
 * Generate prefix according to the type of reference being created,
 * and for which species of livestock.
 * @param {('application' | 'review' | 'endemics')} typeOfReference type of reference to be generated
 * @param {('beef' | 'dairy' | 'pigs' | 'sheep' | undefined)} [typeOfLivestock] which species is the reference being generated for
 * @returns {string} prefix
 */
const getPrefix = (typeOfReference, typeOfLivestock) => {
  let firstTwoCharacters = ''

  switch (typeOfReference) {
    case 'application':
      return 'IAHW'
    case 'review':
      firstTwoCharacters = 'RE'
      break
    case 'endemics':
      firstTwoCharacters = 'FU'
      break
    default:
      throw new Error(`Reference cannot be created due to invalid type of reference: ${typeOfReference}`)
  }

  let lastTwoCharacters = ''

  switch (typeOfLivestock) {
    case 'beef':
      lastTwoCharacters = 'BC'
      break
    case 'dairy':
      lastTwoCharacters = 'DC'
      break
    case 'pigs':
      lastTwoCharacters = 'PI'
      break
    case 'sheep':
      lastTwoCharacters = 'SH'
      break
    default:
      throw new Error(`Reference cannot be created due to invalid type of livestock: ${typeOfLivestock}`)
  }

  return `${firstTwoCharacters}${lastTwoCharacters}`
}

/**
 * Generate unique reference number, prefixed by IAHW for applications
 * or prefixed by specific codes for claims.
 * e.g. IAHW-Z4F1-F2PC for an application
 * or FUBC-A1DD-AAEE for a follow up beef cattle claim
 * @param {('application' | 'review' | 'endemics')} typeOfReference type of reference to be generated
 * @param {('beef' | 'dairy' | 'pigs' | 'sheep' | undefined)} [typeOfLivestock] which species is the reference being generated for
 * @returns {string} unique reference
 */
const createReference = (typeOfReference, typeOfLivestock) => {
  const prefix = getPrefix(typeOfReference, typeOfLivestock)

  const charset = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'
  const id = Array.from({ length: 8 }, () => charset.charAt(randomInt(0, charset.length))).join('')
  const firstFour = id.slice(0, 4)
  const secondFour = id.slice(4)

  return `${prefix}-${firstFour}-${secondFour}`
}

module.exports = createReference
