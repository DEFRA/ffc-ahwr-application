const { randomInt } = require('node:crypto')

/**
 * Generate prefix according to the type of claim the reference being created for
 * and for which species of livestock.
 * @param {('review' | 'endemics')} typeOfReference type of reference to be generated
 * @param {('beef' | 'dairy' | 'pigs' | 'sheep')} typeOfLivestock which species is the reference being generated for
 * @returns {string} prefix
 */
const getPrefix = (typeOfReference, typeOfLivestock) => {
  let firstTwoCharacters = ''

  switch (typeOfReference) {
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
 * Generate unique reference number prefixed by specific codes for claims
 * e.g. FUBC-A1DD-AAEE for a follow up beef cattle claim
 * @param {('review' | 'endemics')} typeOfReference type of claim reference to be generated
 * @param {('beef' | 'dairy' | 'pigs' | 'sheep' | undefined)} [typeOfLivestock] which species is the reference being generated for
 * @returns {string} unique reference
 */
const createClaimReference = (typeOfReference, typeOfLivestock) => {
  const prefix = getPrefix(typeOfReference, typeOfLivestock)

  const charset = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'
  const id = Array.from({ length: 8 }, () => charset.charAt(randomInt(0, charset.length))).join('')
  const firstFour = id.slice(0, 4)
  const secondFour = id.slice(4)

  return `${prefix}-${firstFour}-${secondFour}`
}

/**
 * Takes an existing claim and replaces the prefix with IAHW
 * @param {string} id temp reference
 * @returns {string} unique reference
 */
const createApplicationReference = (id) => {
  return id.replace('TEMP', 'IAHW')
}

module.exports = { createClaimReference, createApplicationReference }
