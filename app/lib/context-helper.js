import { config } from '../config/index.js'
import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE, MULTIPLE_HERDS_RELEASE_DATE } from '../constants/index.js'

export const isVisitDateAfterPIHuntAndDairyGoLive = (dateOfVisit) => {
  const dateOfVisitParsed = new Date(dateOfVisit)
  if (Number.isNaN(dateOfVisitParsed.getTime())) {
    throw new Error(`dateOfVisit must be parsable as a date, value provided: ${dateOfVisit}`)
  }

  return dateOfVisitParsed >= PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
}

export const isMultipleHerdsUserJourney = (dateOfVisit, agreementFlags) => {
  if (!config.multiHerds.enabled || new Date(dateOfVisit) < MULTIPLE_HERDS_RELEASE_DATE) {
    return false
  }

  // only check for rejected T&Cs flag if MH enabled and visit date on/after golive
  if (agreementFlags?.some(f => f.appliesToMh)) {
    return false
  }

  return true
}
