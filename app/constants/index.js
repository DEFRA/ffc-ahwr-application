import { config } from '../config/index.js'

export const PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE = new Date('2025-01-21T00:00:00')

export const MULTIPLE_HERDS_RELEASE_DATE = new Date(config.multiHerds.releaseDate)

export const applicationStatus = {
  agreed: 1,
  inCheck: 5,
  notAgreed: 7,
  readyToPay: 9,
  rejected: 10,
  withdrawn: 2,
  onHold: 11,
  paid: 8,
  recommendToPay: 12,
  recommendToReject: 13
}

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

export const stageExecutionActions = {
  recommendToPay: 'Recommend to pay',
  recommendToReject: 'Recommend to reject',
  authorisePayment: 'Paid',
  authoriseRejection: 'Rejected'
}

export const messagingStates = {
  alreadyClaimed: 'already_claimed',
  alreadySubmitted: 'already_submitted',
  alreadyExists: 'already_exists',
  error: 'error',
  failed: 'failed',
  notFound: 'not_found',
  notSubmitted: 'not_submitted',
  submitted: 'submitted',
  success: 'success'
}
