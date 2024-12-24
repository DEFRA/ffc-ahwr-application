export const livestockTypes = {
  beef: 'beef',
  dairy: 'dairy',
  pigs: 'pigs',
  sheep: 'sheep'
}

export const claimType = {
  review: 'R',
  endemics: 'E'
}

export const testResults = {
  positive: 'positive',
  negative: 'negative'
}

export const speciesNumbers = {
  yes: 'yes',
  no: 'no'
}

export const biosecurity = {
  yes: 'yes',
  no: 'no'
}

export const piHunt = {
  yes: 'yes',
  no: 'no'
}

export const piHuntRecommended = {
  yes: 'yes',
  no: 'no'
}

export const piHuntAllAnimals = {
  yes: 'yes',
  no: 'no'
}

export const minimumNumberOfOralFluidSamples = 5

export const minimumNumberOfAnimalsTested = {
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

