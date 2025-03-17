import { config } from '../config/index.js'
import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE } from '../constants/index.js'

export const isPIHuntEnabledAndVisitDateAfterGoLive = (dateOfVisit) => {
  const dateOfVisitParsed = new Date(dateOfVisit)
  if (Number.isNaN(dateOfVisitParsed.getTime())) {
    throw new Error(`dateOfVisit must be parsable as a date, value provided: ${dateOfVisit}`)
  }

  return config.optionalPIHunt.enabled && dateOfVisitParsed >= PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
}
