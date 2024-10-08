const livestockTypes = {
  beef: 'beef',
  dairy: 'dairy',
  pigs: 'pigs',
  sheep: 'sheep'
}

const claimType = {
  review: 'R',
  endemics: 'E'
}

const testResults = {
  positive: 'positive',
  negative: 'negative'
}

const speciesNumbers = {
  yes: 'yes',
  no: 'no'
}

const biosecurity = {
  yes: 'yes',
  no: 'no'
}

const piHunt = {
  yes: 'yes',
  no: 'no'
}

const piHuntRecommended = {
  yes: 'yes',
  no: 'no'
}

const piHuntAllAnimals = {
  yes: 'yes',
  no: 'no'
}

const minimumNumberOfAnimalsTested = {
  [livestockTypes.beef]: {
    [claimType.review]: 5,
    [claimType.endemics]: 11
  },
  [livestockTypes.dairy]: {
    [claimType.review]: 5,
    [claimType.endemics]: 1
  },
  [livestockTypes.pigs]: {
    [claimType.review]: 30,
    [claimType.endemics]: 30
  },
  [livestockTypes.sheep]: {
    [claimType.review]: 1,
    [claimType.endemics]: 1
  }
}

module.exports = {
  livestockTypes,
  claimType,
  testResults,
  speciesNumbers,
  biosecurity,
  piHunt,
  piHuntRecommended,
  piHuntAllAnimals,
  minimumNumberOfOralFluidSamples: 5,
  minimumNumberOfAnimalsTested
}
