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
 * Replaces the TEMP part of the reference ID to the appropriate 4 characters
 * e.g. TEMP-A1DD-AAEE becomes FUBC-A1DD-AAEE for a follow up beef cattle claim
 * @param {string} id temp reference
 * @param {('review' | 'endemics')} typeOfReference type of claim reference to be generated
 * @param {('beef' | 'dairy' | 'pigs' | 'sheep' | undefined)} [typeOfLivestock] which species is the reference being generated for
 * @returns {string} unique reference
 */
const createClaimReference = (id, typeOfReference, typeOfLivestock) => {
  const prefix = getPrefix(typeOfReference, typeOfLivestock)

  return id.replace('TEMP', prefix)
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
