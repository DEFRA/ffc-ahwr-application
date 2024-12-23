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

const createClaimReference = (id, typeOfReference, typeOfLivestock) => {
  const prefix = getPrefix(typeOfReference, typeOfLivestock)

  return id.replace('TEMP-CLAIM', prefix)
}

const createApplicationReference = (id) => {
  return id.replace('TEMP', 'IAHW')
}

module.exports = { createClaimReference, createApplicationReference }
