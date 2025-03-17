import { config } from '../config/index.js'
import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE } from '../constants/index.js'

export const isPIHuntEnabled = () => {
  return config.optionalPIHunt.enabled
}
export const isPIHuntEnabledAndVisitDateAfterGoLive = (dateOfVisit) => {
  if (!dateOfVisit) {
    throw new Error('dateOfVisit must be provided')
  }

  const dateOfVisitParsed = (dateOfVisit instanceof Date) ? dateOfVisit : new Date(dateOfVisit)
  if (Number.isNaN(dateOfVisitParsed.getTime())) {
    throw new Error(`dateOfVisit must be parsable as a date, value provided: ${dateOfVisit}`)
  }

  return isPIHuntEnabled() && dateOfVisitParsed >= PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
}
