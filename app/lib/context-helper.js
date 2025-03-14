import { config } from '../config/index.js'
import { PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE } from '../constants/index.js'

export const isPIHuntEnabled = () => {
  return config.optionalPIHunt.enabled
}
export const isPIHuntEnabledAndVisitDateAfterGoLive = (dateOfVisitString) => {
  if (!dateOfVisitString) {
    throw new Error('dateOfVisitString must be provided')
  }
  return isPIHuntEnabled() && new Date(dateOfVisitString) >= PI_HUNT_AND_DAIRY_FOLLOW_UP_RELEASE_DATE
}
