import { config } from '../config/index.js'
import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE, MULTIPLE_HERDS_RELEASE_DATE } from '../constants/index.js'

export const isVisitDateAfterPIHuntAndDairyGoLive = (dateOfVisit) => {
  const dateOfVisitParsed = new Date(dateOfVisit)
  if (Number.isNaN(dateOfVisitParsed.getTime())) {
    throw new Error(`dateOfVisit must be parsable as a date, value provided: ${dateOfVisit}`)
  }

  return dateOfVisitParsed >= PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
}

export const isMultipleHerdsUserJourney = (dateOfVisit) => {
  const userAcceptedMultiHerdTCs = true // TODO MultiHerds impl user rejects T&Cs check
  return config.multiHerds.enabled && userAcceptedMultiHerdTCs && new Date(dateOfVisit) >= MULTIPLE_HERDS_RELEASE_DATE
}
